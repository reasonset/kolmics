const currentState = {
  imglist: [],
  bookreader: {
    shown: null,
    // none, ahead:once, ahead:cache, greedy:cache
    preload_strategy: {fetch: "ahead", cache: "cache"},
    prefetched_urls: new Set(),
    prefetched_images: new Map(),
  },
}

const mediaURI = function (path) {
  return "/media/" + encodeURIComponent(path)
}
function show_progress() { void 0 } // Compat
function hide_progress() { void 0 } // Compat

/*
  Function to handle the window close event by gracefully exiting the Neutralino application.
*/
function onWindowClose() {
  Neutralino.app.exit()
}

// Initialize Neutralino
Neutralino.init()

// Register event listeners
Neutralino.events.on("windowClose", onWindowClose)

function stripArgs(args) {
  args.shift()
  let index = args.findIndex(i => (i[0] != "-" || i == "--"))
  if (args[index] == "--") { index++ }
  return (index === -1 || !args[index]) ? [] : args.slice(index)
}

const IMG_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"]
async function normalize_dir(path) {
  let stats
  let dir
  try {
    path = await Neutralino.filesystem.getAbsolutePath(path)
    stats = await Neutralino.filesystem.getStats(path)
    if (stats.isFile) {
      dir = path.replace(/[^/\\]+$/, "") || "."
    } else {
      dir = path
    }

    stats = await Neutralino.filesystem.getStats(dir)
    if (!stats.isDirectory) {
      throw "NO DIR"
    }
  } catch(e) {
    console.error(e)
  }
  return dir
}

async function children(dir) {
  const dir_items = await Neutralino.filesystem.readDirectory(dir)
  const img_files = dir_items
    .filter(i => i.type === "FILE")
    .filter(i => {
      const fn = i.entry.toLowerCase()
      return IMG_EXTENSIONS.some(ext => fn.endsWith(ext))
    })
    .map(i => {
      const dir_prefix = dir.replace(/[^/\\]$/, "")
      return [dir_prefix, i.entry].join("/")
    })
  return img_files.map(i => i.replace(/.*[/\\]/, ""))
}

async function main() {
  const args = stripArgs([...NL_ARGS])
  const dir = await normalize_dir(args[0])
  currentState.imglist = await children(dir)
  try {
    await Neutralino.server.mount("/media", dir)
  } catch(e) {
    console.error(e)
  }
  bookreader.show()
}

/********** Port from LWMP **********/
const bookreader = {
  prefetch_once(prefetch_offset_begin, prefetch_offset_end) {
    for (let prefetch_offset=prefetch_offset_begin; prefetch_offset<=prefetch_offset_end; prefetch_offset++) {
      const url = currentState.imglist[prefetch_offset]
      if (!url) { return }
      if (!currentState.bookreader.prefetched_urls.has(url)) {
        const img = document.createElement("img")
        img.src = mediaURI(url)
        currentState.bookreader.prefetched_urls.add(url)
      }
    }
  },

  prefetch_cache(prefetch_offset_begin, prefetch_offset_end) {
    for (let prefetch_offset=prefetch_offset_begin; prefetch_offset<=prefetch_offset_end; prefetch_offset++) {
      const url = currentState.imglist[prefetch_offset]
      if (!url) { return }
      if (!currentState.bookreader.prefetched_images.has(url)) {
        const img = document.createElement("img")
        img.src = mediaURI(url)
        currentState.bookreader.prefetched_images.set(url, img)
      }
    }
  },

  /**
   * Preload all images
   */
  async prefetch_cache_greedy() {
    if (!currentState.bookreader.preload_strategy.fetch == "greedy") { return }
    this.prefetch_cache(0, (currentState.imglist.length - 1))
    for (const i of currentState.bookreader.prefetched_images) {
      await i[1].decode()
    }
  },

  /**
   * Free all image cache and reset map.
   */
  discard_cache() {
    for (const i of currentState.bookreader.prefetched_images) {
      i[1].src = ""
    }
    currentState.bookreader.prefetched_images = new Map()
    currentState.bookreader.prefetched_urls = new Set()
  },

  /**
   * Returns page img element.
   * @param {number} page
   * @returns {HTMLImageElement}
   */
  img(page) {
    const url = currentState.imglist[page]
    if (!url) { return }
    let img
    switch (currentState.bookreader.preload_strategy.cache) {
      case "cache":
        if (!currentState.bookreader.prefetched_images.has(url)) {
          this.prefetch_cache(page, page)
        }
        return currentState.bookreader.prefetched_images.get(url)
        break
      default:
        img = document.createElement("img")
        img.src = mediaURI(url)
        return img
    }
  },

  async prefetch(page_index) {
    if (currentState.bookreader.preload_strategy.fetch === "none") { return }
    let prefetch_offset_begin, prefetch_offset_end
    switch (currentState.bookreader.preload_strategy.fetch) {
      case "ahead":
        prefetch_offset_begin = page_index + 1
        prefetch_offset_end = page_index + 2
        break
      case "greedy":
        return   // greedy mode already read all images.
    }

    switch (currentState.bookreader.preload_strategy.cache) {
      case "once":
        this.prefetch_once(prefetch_offset_begin, prefetch_offset_end)
        break
      case "cache":
        this.prefetch_cache(prefetch_offset_begin, prefetch_offset_end)
        break
    }

  },

  async show({greedy_load=false, at=0} = {}) {
    if (greedy_load && currentState.bookreader.preload_strategy.fetch == "greedy") {
      show_progress()
      await this.prefetch_cache_greedy()
      hide_progress()
    }

    currentState.currentView = "book"
    const br_box = document.getElementById("BookReaderBox")
    br_box.style.display = "block"
    br_box.style.height = window.innerHeight + "px"
    br_box.style.width = window.innerWidth + "px"
    currentState.bookreader.shown = true
    br_box.focus()
    this.draw(at)
  },

  show_with_state() {
    history.pushState({
      lwmp: true,
      type: "book"
    }, "")
    this.show({greedy_load: true})
  },

  hide({discard_cache=true} = {}) {
    const br_box = document.getElementById("BookReaderBox")
    br_box.style.display = "none"
    currentState.bookreader.shown = false
    if (discard_cache) { this.discard_cache() }
  },

  show_options() {
    const bro_box = document.getElementById("BookReaderOptionModalBox")
    bro_box.style.display = "block"
  },

  hide_options(e) {
    const bro_box = document.getElementById("BookReaderOptionModalBox")
    bro_box.style.display = "none"
    e.stopPropagation()
  },

  touch_callback(e) {
    const br_box = document.getElementById("BookReaderBox")
    const rect = br_box.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const zone_width = rect.width / 5
    const zone_height = rect.height / 3

    if (y < zone_height) {
      this.show_options()
    } else {
      if (x < zone_width) {
        currentState.bookreader.rtl ? this.next2() : this.prev2()
      } else if (x < zone_width * 2) {
        currentState.bookreader.rtl ? this.next1() : this.prev1()
      // Kolmics doesn't have "close book reader" action.
      // } else if (x < zone_width * 3) {
      //   history.back()
      } else if (x < zone_width * 4) {
        currentState.bookreader.rtl ? this.prev1() : this.next1()
      } else {
        currentState.bookreader.rtl ? this.prev2() : this.next2()
      }
    }
  },

  async draw_page_spread({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page}) {
    if (page > currentState.imglist.length - 2) { page = currentState.imglist.length - 2 }
    const img1 = this.img(page)
    const img2 = this.img(page + 1)

    this.prefetch(page + 1)

    await img1.decode()
    await img2.decode()

    const aspect1 = img1.width / img1.height
    const aspect2 = img2.width / img2.height

    if (aspect1 > 1 || aspect2 > 1) {
      currentState.bookreader.force_single = true
      this.draw_page_single({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page})
      return
    } else {
      currentState.bookreader.force_single = false
    }

    const targetHeight = maxHeight
    const drawWidth1 = targetHeight * aspect1
    const drawWidth2 = targetHeight * aspect2

    let fitScale = 1
    if (drawWidth1 > (maxWidth / 2) || drawWidth2 > (maxWidth / 2)) {
      fitScale = Math.min(((maxWidth / 2) / drawWidth1), ((maxWidth / 2) / drawWidth2))
    }

    const finalHeight = targetHeight * fitScale / scale
    const finalWidth1 = drawWidth1 * fitScale / scale
    const finalWidth2 = drawWidth2 * fitScale / scale

    const centerX = rect.width / 2
    const x1 = currentState.bookreader.rtl ? centerX : centerX - finalWidth1
    const y1 = (rect.height - finalHeight) / 2
    const y2 = y1
    const x2 = currentState.bookreader.rtl ? centerX - finalWidth2 : centerX

    ctx.drawImage(img1, x1, y1, finalWidth1, finalHeight)
    ctx.drawImage(img2, x2, y2, finalWidth2, finalHeight)

    currentState.bookreader.page = page
    pagenum.value = page + 1
  },

  async draw_page_single({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page}) {
    if (page > currentState.imglist.length - 1) { page = currentState.imglist.length - 1 }
    const img = this.img(page)

    this.prefetch(page)

    img.decode().then(() => {
      const hScale = maxHeight / img.height
      const wScale = maxWidth / img.width
      const iscale = Math.min(hScale, wScale)
      const drawWidth = img.width * iscale / scale
      const drawHeight = img.height * iscale / scale

      const y = (rect.height - drawHeight) / 2
      const centerX = rect.width / 2
      const x = centerX - (drawWidth / 2)
      ctx.drawImage(img, x, y, drawWidth, drawHeight)

      currentState.bookreader.page = page
      pagenum.value = page + 1
    })
  },

  draw(page=0) {
    const pagenum = document.getElementById("BookReaderPageNumber")
    const canvas = document.getElementById("BookReaderCanvas")
    const ctx = canvas.getContext("2d")
    const scale = window.devicePixelRatio

    const desired_height = window.innerHeight
    canvas.style.height = desired_height + "px"
    const rect = canvas.getBoundingClientRect()
    const maxWidth = rect.width * scale
    const maxHeight = rect.height * scale
    canvas.width = maxWidth
    canvas.height = maxHeight
    ctx.scale(scale, scale)

    if (page < 0) { page = 0 }

    currentState.force_single = false
    if (currentState.bookreader.spread) {
      this.draw_page_spread({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page})
    } else {
      this.draw_page_single({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page})
    }
  },

  next1() {
    this.draw(currentState.bookreader.page + 1)
  },

  next2() {
    const pages = (currentState.bookreader.spread && !currentState.bookreader.force_single) ? 2 : 1
    this.draw(currentState.bookreader.page + pages)
  },

  prev1() {
    this.draw(currentState.bookreader.page - 1)
  },

  prev2() {
    const pages = (currentState.bookreader.spread && !currentState.bookreader.force_single) ? 2 : 1
    this.draw(currentState.bookreader.page - pages)
  },

  opt_spread(e) {
    currentState.bookreader.spread = !currentState.bookreader.spread
    this.draw(currentState.bookreader.page)
    e.preventDefault()
  },

  opt_rtl(e) {
    currentState.bookreader.rtl = !currentState.bookreader.rtl
    this.draw(currentState.bookreader.page)
    e.preventDefault()
  },

  opt_jump(e) {
    const pagenum = document.getElementById("BookReaderPageNumber")
    const target_page = pagenum.value || 1
    this.draw(Number(target_page) - 1)
    e.preventDefault()
  }
}

const msg_show = function(text, type="info") {
  const box = document.getElementById("MsgBox")
  box.innerText = text
  if (type === "err") {
    box.className = "msgshow_err"
  } else {
    box.className = "msgshow_info"
  }

  setTimeout(
    ()=> {
      box.className = "msghide"
    }, 3000
  )
}

document.getElementById("BookReaderBox").addEventListener("click", e => {bookreader.touch_callback(e)})
document.getElementById("BookReaderBox").addEventListener("click", e => { e.stopPropagation() })
document.getElementById("BookReaderOptionModalBox").addEventListener("click", e => {bookreader.hide_options(e)})
document.getElementById("BookReaderOptionModal").addEventListener("click", e => { e.stopPropagation() })
document.getElementById("BookReaderOptionSpread").addEventListener("click", e => {bookreader.opt_spread(e)})
document.getElementById("BookReaderOptionOrder").addEventListener("click", e => {bookreader.opt_rtl(e)})
document.getElementById("BookReaderPageJump").addEventListener("click", e => {bookreader.opt_jump(e)})

// Setup resize event
window.addEventListener("resize", e => {
  const vpx = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  if (vpx != currentState.viewportX) {
    currentState.scroll_position = {}
    currentState.viewportX = vpx
  }

  if (currentState.bookreader.shown) {
    bookreader.hide({discard_cache: false})

    setTimeout(() => {
      bookreader.show({at: currentState.bookreader.page})
    }, 300)
  }
})

// Setup keyboard event
document.getElementById("BookReaderBox").addEventListener("keydown", async e => {
  if (e.code === "ArrowDown") {
    bookreader.next2()
    e.preventDefault()
  } else if (e.code === "ArrowUp") {
    bookreader.prev2()
    e.preventDefault()
  } else if (e.code === "ArrowLeft") {
    currentState.bookreader.rtl ? bookreader.next2() : bookreader.prev2()
    e.preventDefault()
  } else if (e.code === "ArrowRight") {
    currentState.bookreader.rtl ? bookreader.prev2() : bookreader.next2()
    e.preventDefault()
  } else if (e.code === "PageDown") {
    bookreader.next1()
    e.preventDefault()
  } else if (e.code === "PageUp") {
    bookreader.prev1()
    e.preventDefault()
  } else if (e.code === "Home") {
    const pagenum = document.getElementById("BookReaderPageNumber")
    pagenum.value = 1
    bookreader.opt_jump(e)
  } else if (e.code === "End") {
    const pagenum = document.getElementById("BookReaderPageNumber")
    pagenum.value = currentState.imglist.length // Adjust last page in draw.
    bookreader.opt_jump(e)
  } else if (e.key === "s" || e.key === "d") {
    bookreader.opt_spread(e)
  } else if (e.key === "r" || e.key === "m") {
    bookreader.opt_rtl(e)
  } else if (e.key === "F11" || e.key === "f") {
    const isFullScreen = await Neutralino.window.isFullScreen()
    if (isFullScreen) {
      await Neutralino.window.exitFullScreen()
    } else {
      await Neutralino.window.setFullScreen()
    }
    e.preventDefault()
  } else if (e.code === "Escape") {
    const isFullScreen = await Neutralino.window.isFullScreen()
    if (isFullScreen) {
      await Neutralino.window.exitFullScreen()
    } else {
      Neutralino.app.exit()
    }
  }
})
/************************************/

document.getElementById("BookReaderBox").addEventListener("wheel", ev => {
  if (ev.deltaY > 0) {
    bookreader.next2()
  } else if (ev.deltaY < 0) {
    bookreader.prev2()
  }
  ev.preventDefault()
})

document.getElementById("BookReaderOptionModal").addEventListener("wheel", ev => {
  ev.stopPropagation()
})

document.getElementById("BookReaderOptionPreloadPageSubmit").addEventListener("click", async ev => {
  const options = document.getElementById("BookReaderOptionPreloadPage")
  const value = options.value.split(":")
  currentState.bookreader.preload_strategy.fetch = value[0]
  currentState.bookreader.preload_strategy.cache = value[1] || null
  ev.preventDefault()
  ev.stopPropagation()

  if (value[0] == "greedy") {
    await bookreader.prefetch_cache_greedy()
  }
})

main()
