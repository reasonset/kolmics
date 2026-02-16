const currentState = {
  imglist: [],
  bookreader: {
    shown: null
  },
  prefetched: new Set()
}

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

async function prefetch(page_index) {
  [1,2].forEach(prefetch_offset => {
    const url = currentState.imglist[page_index + prefetch_offset]
    if (!currentState.prefetched.has(url)) {
      const img = document.createElement("img")
      img.src = "/media/" + encodeURIComponent(url)
    }
  })
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
  show_bookreader()
}

/********** Port from LWMP **********/
const show_bookreader = function() {
  currentState.currentView = "book"
  const br_box = document.getElementById("BookReaderBox")
  br_box.style.display = "block"
  br_box.style.height = window.innerHeight + "px"
  br_box.style.width = window.innerWidth + "px"
  currentState.bookreader.shown = true
  br_box.focus()
  draw_bookreader_page()
}

const hide_bookreader = function() {
  const br_box = document.getElementById("BookReaderBox")
  br_box.style.display = "none"
  currentState.bookreader.shown = false
}

const show_bookreader_options = function() {
  const bro_box = document.getElementById("BookReaderOptionModalBox")
  bro_box.style.display = "block"
}

const hide_bookreader_options = function(e) {
  const bro_box = document.getElementById("BookReaderOptionModalBox")
  bro_box.style.display = "none"
  e.stopPropagation()
}

const bookreader_touch_callback = function(e) {
  const br_box = document.getElementById("BookReaderBox")
  const rect = br_box.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const zone_width = rect.width / 5
  const zone_height = rect.height / 3

  if (y < zone_height) {
    show_bookreader_options()
  } else {
    if (x < zone_width) {
      currentState.bookreader.rtl ? bookreader_next2() : bookreader_prev2()
    } else if (x < zone_width * 2) {
      currentState.bookreader.rtl ? bookreader_next1() : bookreader_prev1()
    } else if (x < zone_width * 3) {
      history.back()
    } else if (x < zone_width * 4) {
      currentState.bookreader.rtl ? bookreader_prev1() : bookreader_next1()
    } else {
      currentState.bookreader.rtl ? bookreader_prev2() : bookreader_next2()
    }
  }
}

const draw_bookreader_page = function(page=0) {
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
    draw_bookreader_page_spread({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page})
  } else {
    draw_bookreader_page_single({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page})
  }
}

const draw_bookreader_page_spread = function({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page}) {
  if (page > currentState.imglist.length - 2) { page = currentState.imglist.length - 2 }
  const img1 = new Image()
  const img2 = new Image()

  img1.src = "/media/" + encodeURIComponent(currentState.imglist[page])
  img2.src = "/media/" + encodeURIComponent(currentState.imglist[page + 1])
  prefetch(page + 1)

  let loaded = 0
  const onLoad = () => {
    loaded++
    if (loaded < 2) {return}

    const aspect1 = img1.width / img1.height
    const aspect2 = img2.width / img2.height

    if (aspect1 > 1 || aspect2 > 1) {
      currentState.bookreader.force_single = true
      draw_bookreader_page_single({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page})
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
  }

  img1.onload = onLoad
  img2.onload = onLoad
}

const draw_bookreader_page_single = async function({pagenum, canvas, ctx, scale, rect, maxWidth, maxHeight, page}) {
  if (page > currentState.imglist.length - 1) { page = currentState.imglist.length - 1 }
  const img = new Image()

  img.src = "/media/" + encodeURIComponent(currentState.imglist[page])
  prefetch(page)

  img.onload = () => {
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
  }
}

const bookreader_next1 = function() {
  draw_bookreader_page(currentState.bookreader.page + 1)
}

const bookreader_next2 = function() {
  const pages = (currentState.bookreader.spread && !currentState.bookreader.force_single) ? 2 : 1
  draw_bookreader_page(currentState.bookreader.page + pages)
}

const bookreader_prev1 = function() {
  draw_bookreader_page(currentState.bookreader.page - 1)
}

const bookreader_prev2 = function() {
  const pages = (currentState.bookreader.spread && !currentState.bookreader.force_single) ? 2 : 1
  draw_bookreader_page(currentState.bookreader.page - pages)
}

const bookreader_opt_spread = function(e) {
  currentState.bookreader.spread = !currentState.bookreader.spread
  draw_bookreader_page(currentState.bookreader.page)
  e.preventDefault()
}

const bookreader_opt_rtl = function(e) {
  currentState.bookreader.rtl = !currentState.bookreader.rtl
  draw_bookreader_page(currentState.bookreader.page)
  e.preventDefault()
}

const bookreader_opt_jump = function(e) {
  const pagenum = document.getElementById("BookReaderPageNumber")
  const target_page = pagenum.value || 1
  draw_bookreader_page(Number(target_page) - 1)
  e.preventDefault()
}

document.getElementById("BookReaderBox").addEventListener("click", bookreader_touch_callback)
document.getElementById("BookReaderBox").addEventListener("click", e => { e.stopPropagation() })
document.getElementById("BookReaderOptionModalBox").addEventListener("click", hide_bookreader_options)
document.getElementById("BookReaderOptionModal").addEventListener("click", e => { e.stopPropagation() })
document.getElementById("BookReaderOptionSpread").addEventListener("click", bookreader_opt_spread)
document.getElementById("BookReaderOptionOrder").addEventListener("click", bookreader_opt_rtl)
document.getElementById("BookReaderPageJump").addEventListener("click", bookreader_opt_jump)

// Setup resize event
window.addEventListener("resize", e => {
  const vpx = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  if (vpx != currentState.viewportX) {
    currentState.scroll_position = {}
    currentState.viewportX = vpx
  }

  if (currentState.bookreader.shown) {
    hide_bookreader()

    setTimeout(() => {
      show_bookreader()
    }, 300)
  }
})

// Setup keyboard event
document.getElementById("BookReaderBox").addEventListener("keydown", async e => {
  if (e.code === "ArrowDown") {
    bookreader_next2()
    e.preventDefault()
  } else if (e.code === "ArrowUp") {
    bookreader_prev2()
    e.preventDefault()
  } else if (e.code === "ArrowLeft") {
    currentState.bookreader.rtl ? bookreader_next2() : bookreader_prev2()
    e.preventDefault()
  } else if (e.code === "ArrowRight") {
    currentState.bookreader.rtl ? bookreader_prev2() : bookreader_next2()
    e.preventDefault()
  } else if (e.ctrlKey && e.code === "PageDown") {
    bookreader_next1()
    e.preventDefault()
  } else if (e.ctrlKey && e.code === "PageUp") {
    bookreader_prev1()
    e.preventDefault()
  } else if (e.code === "PageDown") {
    bookreader_next2()
    e.preventDefault()
  } else if (e.code === "PageUp") {
    bookreader_prev2()
    e.preventDefault()
  } else if (e.code === "Home") {
    const pagenum = document.getElementById("BookReaderPageNumber")
    pagenum.value = 1
    bookreader_opt_jump(e)
  } else if (e.code === "End") {
    const pagenum = document.getElementById("BookReaderPageNumber")
    pagenum.value = currentState.imglist.length // Adjust last page in draw.
    bookreader_opt_jump(e)
  } else if (e.key === "s" || e.key === "d") {
    bookreader_opt_spread(e)
  } else if (e.key === "r" || e.key === "m") {
    bookreader_opt_rtl(e)
  } else if (e.key === "F11" || e.key === "f") {
    const isFullScreen = await Neutralino.window.isFullScreen()
    if (isFullScreen) {
      await Neutralino.window.exitFullScreen()
    } else {
      await Neutralino.window.setFullScreen()
    }
    e.preventDefault()
  }
})
/************************************/

document.getElementById("BookReaderBox").addEventListener("wheel", ev => {
  if (ev.deltaY > 0) {
    bookreader_next2()
  } else if (ev.deltaY < 0) {
    bookreader_prev2()
  }
  ev.preventDefault()
})

main()