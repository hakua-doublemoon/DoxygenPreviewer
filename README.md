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

## more information

* [Github repository](https://github.com/hakua-doublemoon/DoxygenPreviewer)

* [Introduction in Qiita](https://qiita.com/hakua-doublemoon/items/c328a7bf0bc7a1fbef14)

* [Doxygen](https://github.com/doxygen/doxygen)
    * 内部のdoxygen生成機能はdoxygenのaddon/doxyappの改造品を使っています。それらDoxygenに直接由来するバイナリーやソースコードのライセンスはDoxygenのライセンスに依存します。


