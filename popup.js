document.addEventListener('DOMContentLoaded', function() {
  const dropAreaElm = document.getElementById('drop-area');
  const msgDivElm = document.getElementById('msg');

  // 現在のアクティブタブのURLを取得
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];

    const url = new URL(currentTab.url);

    // 山行記録作成ページのstep1かどうかを確認
    if (url.hostname.includes('yamareco.com') && (url.pathname.includes('/step1_create.php') || url.pathname.includes('/step1_edit.php'))) {
      // ドラッグ＆ドロップ領域のメッセージを変更
      dropAreaElm.querySelector('p').textContent = 'activity.jsonをドラッグ＆ドロップしてください';
    } else {
      // 対応していないページの場合
      dropAreaElm.querySelector('p').textContent = 'この拡張機能は山行記録作成開始ページでのみ使用できます。';
    }
  });

  // ドラッグオーバー時にスタイルを変更
  dropAreaElm.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropAreaElm.classList.add('dragover');
  });

  // ドラッグが終了したらスタイルを戻す
  dropAreaElm.addEventListener('dragleave', () => {
    dropAreaElm.classList.remove('dragover');
  });

  // ドロップされたときの処理
  dropAreaElm.addEventListener('drop', (event) => {
    event.preventDefault();
    dropAreaElm.classList.remove('dragover');
    msgDivElm.textContent = ''; // メッセージをクリア

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name !== 'activity.json') {
        msgDivElm.textContent = 'ドロップされたファイルはactivity.jsonではありません';
        return;
      }
      readFile(file);
    }
  });

  // ファイルを読み込む
  function readFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      const content = event.target.result;
  
      // JSON形式かどうかを確認するためのトライキャッチブロック
      let jsonData;
      try {
        // JSON形式であればオブジェクトに変換
        jsonData = JSON.parse(content);
      } catch (error) {
        // 変換できなかった場合（つまりJSON形式でない場合）はエラーメッセージを表示
        msgDivElm.textContent = 'ファイルはJSON形式ではありません。';
        return; // 処理を中断
      }
  
      // 正常に読み込めた(^^)
      msgDivElm.textContent = 'activity.jsonを正常に読み込みました。';
  
      // 念のため、今後の処理のためにデータを保存する
      chrome.storage.local.set({ activityData: jsonData }, function() {
        console.log('データが保存されました');
      });
  
      // 現在のタブにデータを送信する
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'importActivityData', data: jsonData });
      });
    };
  
    reader.onerror = function() {
      msgDivElm.textContent = 'ファイルの読み込みに失敗しました。';
    };
  
    reader.readAsText(file); // ファイルをテキストとして読み込む
  }
  
});
