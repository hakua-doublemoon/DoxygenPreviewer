# Doxygen Previewer

今まさに編集しているファイルのdoxygenを生成し表示します。

## Target & Environment (Requirements)

* c, h, cpp, hppを処理します。それ以外は無視します。
* Windows環境 x64を想定しています。
    + Tmp環境変数が設定されていることが必要です。
    + 32bit環境ではたぶん動きません。

## Usage

* ソースコード（cやh）をアクティブにした状態で、`doxygen previewer`コマンドを(ctrl+shift+pから)実行してください。

### トラブルシューティング

* 実行時にもし`Please close %Temp% directory`と出た場合は再度コマンドを実行してみてください。

## Release Notes

### [Unreleased]

* プレビュー表示時に再度コマンドを実行してもプレビューの位置を変えないようにします。
* 新しくカラムを開かない方をデフォルトにします。
* 0.1.1でリンクを移動できるようにしましたが、そのうちリンク元に戻れるようにします。
* 32bitに対応します（余力があれば）

### [0.1.1]

Doxygenのドキュメントのブラウジングを大分強化しました。

### [0.0.3]

β版みたいなものです。一応それなりに使えるつもりですが不具合はあるかもしれません。

### [0.0.1][0.0.2]

α版です。何が起こっても不思議ではありません。

## more information

* [Github repository](https://github.com/hakua-doublemoon/DoxygenPreviewer)

* [Introduction in Qiita](https://qiita.com/hakua-doublemoon/items/c328a7bf0bc7a1fbef14)

* [Doxygen](https://github.com/doxygen/doxygen)
    * 内部のdoxygen生成機能はdoxygenのaddon/doxyappの改造品を使っています。それらDoxygenに直接由来するバイナリーやソースコードのライセンスはDoxygenのライセンスに依存します。


