# kolmics

## Synopsis

Book reader/comic viewer optimized for keyboard and mouse operation based on LWMP with Neutralinojs

## Description

Kolmics(Keyboard Oriented Local coMICS viewer)は[localwebmediaplayer](https://github.com/reasonset/localwebmediaplayer)のブックリーダー機能を取り出し、[Neutralinojs](https://neutralino.js.org)を使ってデスクトップアプリ化したブックリーダー/マンガビューワである。

デスクトップアプリ化に伴って、ブックリーダーに特化したショートカットキーをいくつか追加している。一方、ブックリーダーを閉じる動作は削除されている。

アプリケーションはNeutralinojs以外の外部依存を持っておらず、Neutralinojsも外部依存を持っていない、クリーンなVanilla JavaScriptで書かれている。

ショートカットキーは以前のバージョンのMComixにインスパイアされており、MComicsからいくつかのショートカットキーが失われたことがこのアプリケーションの制作動機である。

このアプリケーションがサポートしている主な機能に以下の通り

* ディレクトリ内の画像をファイル名を辞書順でソートして表示 (のみ)
* ポートレート画像を左右に並べる見開き表示
* ページの進行方向の左右反転 (マンガモード)
* 見開き表示がオンでもランドスケープ画像を単独で表示
* 見開き表示がオンの場合の1ページだけ進む/戻る
* ページジャンプ
* ウィンドウのサイズに合わせてベストフィット拡大表示 (常に)
* 快適なキーボード操作
* 快適なマウス操作

## インストール

### 一般的なインストール

[リリースページ](https://github.com/reasonset/kolmics/releases)から最新のバイナリZIPを入手し、適切な場所に展開する。
(例えばLinuxなら`~/.local/opt`など)

これでバイナリをコマンドから実行できる。

### Linux

Linuxの場合、追加で`install/linux`以下のものを導入すると使いやすい。

* `kolmics`
    * `$PATH`の通ったディレクトリに配置するための実行コマンド
    * インストール先は `$HOME/.local/opt/kolmics` であることを前提にしているので、必要に応じて変更して使用する
* `kolmics.desktop`
    * アプリケーションの関連付けに使うことができる`.desktop`ファイル
    * ユーザー固有の場合は`~/.local/share/applcations`に、システムワイドの場合は`/usr/share/applications`または`/usr/local/share/applications`に配置する
* `kolmics.nemo_action`
    * Nemoを使用している場合に右クリックから開くための`nemo_action`
    * `.desktop`ファイルを使って開くにはファイルを開く必要があるが、この`nemo_action`はディレクトリ内のなにもないところで右クリックしてそのディレクトリを開けるようになる
* `kolmics.svg`
    * アイコンファイルです
    * `~/.local/share/pixmaps`に配置することで`kolmic.desktop`から認識される

`install.bash` はこれらの処理を代わりに行う。

Linux用のインストール用リソースはZIPには(現状では)含まれていないので、リポジトリ内のものを利用すること。

### Windows

ZIPに同梱されている`install.bat`を実行する。
(リポジトリ上では`install/windows/install.bat`として置かれている)

これにより「送る」メニューに追加される。

## 使い方

```
<kolmics_binary> <filepath>
```

`filepath`は画像の入ったディレクトリ、または画像ファイルである。
画像ファイルが指定された場合、そのファイルが置かれているディレクトリに変換される。

*Kolmicsは画像ファイルの入った単一階層のディレクトリのみをサポートする。*
アーカイブファイルや再帰的なディレクトリ、PDFやePubファイルなどはサポートしない。

画像ファイルは適切な拡張子を持つPNG, JPG, JPEG, WebP, AVIFのみがサポートされている。
これは`img`要素での表示に依存しているためで、将来的にブラウザでのサポートが広がれば、それに合わせて対応する画像形式も拡張される可能性がある。

## ショートカット

|キー|動作|
|------|-----------|
|`↑`, `PageUp`|ページを戻る|
|`↓`, `PageDown`|ページを進む|
|`←`|ページを左へ進む|
|`→`|ページを右へ進む|
|`Ctrl + PageUp`|ページを1ページ戻る|
|`Ctrl + PageDown`|ページを1ページ進む|
|`Home`|最初のページへ|
|`End`|最後のページへ|
|`s`, `d`|見開き表示をトグル|
|`r`, `m`|ページの進行方向を反転|
|`F11`, `f`|全画面表示をトグル|

## マウス操作

|操作|動作|
|------|-----------|
|ボックスの上部をクリック|設定を表示|
|ボックスの左をクリック|ページを左へ進む|
|ボックスの右をクリック|ページを右へ進む|
|ボックスの中央左をクリック|ページを1ページ左へ進む|
|ボックスの中央右をクリック|ページを1ページ右へ進む|
|ホイールアップ|ページを戻る|
|ホイールダウン|ページを進む|
