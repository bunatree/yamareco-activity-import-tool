function getNumberOfDays(days) {
  if (days === "日帰り") {
    return 1;
  }
  const match = days.match(/(\d+)\s*DAYS/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  // 不明な形式の場合は1日とみなす
  return 1;
}

function calcStartAndEndDates(date, days) {
  // "2024.08.10(土)" のような形式の date を年、月、日に分解
  const datePattern = /^(\d{4})\.(\d{2})\.(\d{2})/;
  const match = date.match(datePattern);
  if (!match) {
    throw new Error("日付の形式が正しくありません");
  }

  const startYear = parseInt(match[1], 10);
  const startMonth = parseInt(match[2], 10);
  const startDay = parseInt(match[3], 10);

  // JavaScriptのDateオブジェクトを使用して、終了日を計算
  const startDate = new Date(startYear, startMonth - 1, startDay); // 月は0始まりなので調整
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days - 1); // 開始日を含むためdays - 1

  return {
    startYear: startDate.getFullYear(),
    startMonth: startDate.getMonth() + 1, // 月は0始まりなので1足す
    startDay: startDate.getDate(),
    endYear: endDate.getFullYear(),
    endMonth: endDate.getMonth() + 1,
    endDay: endDate.getDate()
  };

}

function getGenreFromTags(tags) {

  // ヤマレコで定義されているジャンルと番号の対応
  const objGenre = {
    1: "ハイキング",
    2: "無雪期ピークハント／縦走",
    3: "積雪期ピークハント／縦走",
    4: "沢登り",
    5: "アルパインクライミング",
    6: "フリークライミング",
    7: "アイスクライミング",
    8: "山滑走",
    9: "ゲレンデ滑走",
    10: "トレイルラン",
    11: "雪山ハイキング",
    20: "講習／トレーニング",
    100: "キャンプ等、その他"
  };

  // タグの文字列を半角スペースで分割して配列に変換
  const arrayTags = tags.split(' ');

  // 完全一致を探す
  for (const [key, value] of Object.entries(objGenre)) {
    if (arrayTags.includes(value)) {
      // 完全一致の場合はそのキーを返す
      return parseInt(key, 10);
    }
  }

  // 部分一致を探す
  for (const [key, value] of Object.entries(objGenre)) {
    for (const tag of arrayTags) {
      if (value.includes(tag)) {
        // 最初の部分一致の場合はそのキーを返す
        return parseInt(key, 10);
      }
    }
  }

  // 一致するものがなければ0を返す
  return 0;

}

function getAreaFromMapName(mapName) {

  // YAMAPとヤマレコの地域および山域の対応表
  // YAMAPは地図が分割されていたり重複していたりしてわかりにくい...
  const objMapNames = {
    "塔ノ岳・丹沢山・蛭ヶ岳": [300, 307],
    "大室山・畦ヶ丸山・菰釣山": [300, 307],
    "三国山・大洞山・不老山": [300, 307],
    "高麗山・湘南平・鷹取山": [300, 307],
    "三浦アルプス・二子山・仙元山": [300, 308],
    "大楠山・武山・三浦富士": [300, 308],
    "三浦市・関東ふれあいの道": [300, 308],
    "箱根山・神山": [300, 309],
    // 必要に応じてさらに追加
  };

  // 対応表のキーに部分一致するものを探す
  for (const key in objMapNames) {
    if (mapName.includes(key)) {
      // 一致するものが見つかったら、その地域と山域を返す
      return objMapNames[key];
    }
  }

  // 一致するものがなければ[0, 0]を返す
  return [0, 0];

}


async function yamaRecoStep1(jsonData) {
  console.log('#### function yamaRecoStep1');
  console.log({jsonData})

  // 場所
  const placeInputElm = document.querySelector('input[name="place"]');
  // エリア選択
  const area1SelectElm = document.getElementById('area1');
  const area2SelectElm = document.getElementById('area2');
  // ジャンル
  const genreSelectElm = document.getElementById('genre');
  // 日程
  const sYearSelectElm = document.querySelector('select[name="start_y"]');
  const sMonthSelectElm = document.querySelector('select[name="start_m"]');
  const sDaySelectElm = document.querySelector('select[name="start_d"]');
  const eYearSelectElm = document.querySelector('select[name="end_y"]');
  const eMonthSelectElm = document.querySelector('select[name="end_m"]');
  const eDaySelectElm = document.querySelector('select[name="end_d"]');
  
  // タイトル反映
  if (placeInputElm) {
    placeInputElm.value = jsonData.title;
  }

  // ジャンルはタグから拾ってくる
  const genreNum = getGenreFromTags(jsonData.tags);
  // ジャンルのドロップダウンリストに反映
  genreSelectElm.value = genreNum;

  // YAMAPの地図名からヤマレコの山域を特定する
  const regionMt = getAreaFromMapName(jsonData.mapName);
  // エリア選択ドロップダウンリストに反映
  area1SelectElm.value = regionMt[0];
  area2SelectElm.value = regionMt[1];

  // 山行日数を取得
  const numDays = getNumberOfDays(jsonData.days);
  // 開始日と終了日をオブジェクトで得る
  const objStartEndDates = calcStartAndEndDates(jsonData.date,numDays);
  // 日付ドロップダウンリストに反映
  sYearSelectElm.value = objStartEndDates.startYear;
  sMonthSelectElm.value = objStartEndDates.startMonth;
  sDaySelectElm.value = objStartEndDates.startDay;
  eYearSelectElm.value = objStartEndDates.endYear;
  eMonthSelectElm.value = objStartEndDates.endMonth;
  eDaySelectElm.value = objStartEndDates.endDay;

}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log({request});

  if (request.action === 'recordStep1') {
    yamaRecoStep1(request.data);
  } else if (request.action === 'recordStep2') {
    //yamaRecoStep2(request.data);
  } else if (request.action === 'recordStep4') {
    // yamaRecoStep4(request.data);
  }
  
});