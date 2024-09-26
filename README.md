# Yamareco Activity Import Tool
## YAMAPからエクスポートされたデータをヤマレコに山行記録としてインポートするChrome拡張機能

この Chrome 拡張機能は、拙作の YAMAP Activity Export Tool (YAMAPの活動日記をエクスポートするChrome拡張機能) によってエクスポートされた活動日記データをヤマレコに山行記録としてアップロードするためのお助けツールです。

YAMAP からのエクスポートしたデータをそのままヤマレコのへのインポートに使えたら面白いのではないかと考えて制作しました。

## 使い方

ブラウザーでヤマレコの山行記録の作成/編集ページを開きます。

拡張機能のアイコン（緑の▲アイコン）をクリックしてメニューを表示して、「ドラッグ＆ドロップ activity.json」と表示された領域に、YAMAP からエクスポートした activity.json ファイルをドラッグ＆ドロップしてください。

ヤマレコの山行記録の作成/編集には、次の 5 つのステップがあります。

1. 日程・概要
2. 写真登録
3. ルート作成
4. コースタイム・感想
5. 公開設定

これらのステップの内、1、2、4 のステップのページを表示すると、当拡張機能のメニューのボタンが青くなります。ボタンをクリックすると、activity.json から読み込んだデータを特定の場所に反映させます。

ステップ 2 では、YAMAP からエクスポートした写真を手動で指定して登録してください。

ステップ 3 では、YAMAP からエクスポートした GPX ファイルを手動で指定して登録してください。

## ライセンス

[Bleach free icon by Freepik - Flaticon](https://www.flaticon.com/free-icon/bleach_481058) … Free for personal and commercial purpose with attribution.

[Arrow free icon created by prinda895 - Flaticon](https://www.flaticon.com/free-icon/arrow_16111384) ... Free for personal and commercial purpose with attribution.

## 動作確認

Browser: Google Chrome 128.0.6613.120 (Official Build) (arm64)

OS: macOS バージョン14.6.1（ビルド23G93）