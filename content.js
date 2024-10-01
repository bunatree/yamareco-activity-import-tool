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
    // 関東
    "六道山 ・多摩湖・狭山湖": [300,300],
    "加治丘陵・七国山": [300,300],
    // 日光・那須・筑波
    // 尾瀬・奥利根
    // 谷川・武尊
    // 赤城・榛名・荒船
    // 奥武蔵

    // 奥多摩・高尾
    "七国山": [300, 306],
    "城山・三増峠": [300, 306],
    "高尾山・陣馬山・景信山": [300, 306],
    "雲取山・鷹ノ巣山・七ツ石山": [300, 306],
    "甲州街道（小原宿～野田尻宿）": [300, 306],
    "八重山・能岳・聖武連山・要害山": [300, 306],
    "石老山・ 石砂山": [300, 306],
    "名倉金剛山・鶴島金剛山": [300, 306],
    "倉岳山・高畑山・九鬼山": [300, 306],
    "高川山": [300, 306],
    "倉岳山・高畑山・九鬼山": [300, 306],
    "百蔵山・扇山・権現山": [300, 306],
    "権現山・奈良倉山": [300, 306],
    "臼杵山・市道山・刈寄山": [300, 306],
    "網代弁天山・網代城山": [300, 306],
    "浅間嶺・松生山": [300, 306],
    "三頭山・槇寄山・土俵岳": [300, 306],
    "大岳山・御岳山・御前山": [300, 306],
    "赤ぼっこ": [300, 306],
    "高水山・岩茸石山・惣岳山": [300, 306],
    "川苔山（川乗山）": [300, 306],
    "雲取山・鷹ノ巣山・七ツ石山": [300, 306],
    // 丹沢
    "塔ノ岳・丹沢山・蛭ヶ岳": [300, 307],
    "大室山・畦ヶ丸山・菰釣山": [300, 307],
    "三国山・大洞山・不老山": [300, 307],
    "高麗山・湘南平・鷹取山": [300, 307],
    "東海道五十三次（大磯宿・小田原宿）": [300, 307],
    "不動山・浅間山・曽我山": [300, 307],
    "弘法山": [300, 307],
    "八国見山・頭高山": [300, 307],
    "大山": [300, 307],
    "高松山・大野山": [300, 307],
    "仙洞寺山・南山・津久井堂所山": [300, 307],
    // 房総・三浦
    "三浦アルプス・二子山・仙元山": [300, 308],
    "鎌倉アルプス（大平山・天台山）": [300, 308],
    "鎌倉市": [300, 308],
    "観音崎 サイクリング": [300, 308],
    "大楠山・武山・三浦富士": [300, 308],
    "三浦市・関東ふれあいの道": [300, 308],
    "三浦市・関東ふれあいの道（三浦・岩礁のみち, 油壺・入江のみち, 荒崎・潮騒のみち, 小網代の森）": [300, 308],
    "江の島": [300, 308],
    "鷹取山": [300, 308],
    "金沢山・稲荷山・日向山": [300, 308],
    // 箱根・湯河原
    "金時山・明神ヶ岳": [300, 309],
    "矢倉岳": [300, 309],
    "箱根山・神山": [300, 309],
    "幕山・南郷山": [300, 309],
    // 奥秩父
    "滝子山・大谷ヶ丸・笹子雁ヶ腹摺山": [300,310], // ヤマレコでは笹子雁ヶ腹摺山は富士・御坂に分類されている
    "雁ヶ腹摺山・岩殿山": [300,310],
    "和名倉山・笠取山・東仙波": [300,310],
    "倉掛山・鈴庫山・小倉山": [300,310],
    "大菩薩嶺・鶏冠山・大マテイ山": [300,310],
    "小楢山・妙見山・乙女高原": [300,310],

    // 甲信越
    "甲州高尾山・宮宕山・源次郎岳": [500,500],
    "塩ノ山": [500,500],
    "要害山・兜山・大蔵経寺山": [500,500],
    "甲州街道（勝沼宿～甲府柳町宿）": [500,500],
    "興因寺山・淡雪山・八王子山": [500,500],
    "茅ヶ岳・金ヶ岳・太刀岡山": [500,500],
    "弥三郎岳（羅漢寺山）": [500,500],
    "帯那山": [500,500],
    "男山・天狗山": [500,500],
    // 富士・御坂
    "富士山": [500, 503],
    "富士山登山ルート3776 1日目コース": [500, 503],
    "富士山登山ルート3776 2日目コース": [500, 503],
    "富士山登山ルート3776 3日目コース": [500, 503],
    "富士山登山ルート3776 4日目コース": [500, 503],
    "御正体山・杓子山・石割山": [500, 503],
    "FUJISAN LONG TRAIL（忍野・山中湖エリア EAST）": [500, 503],
    "FUJISAN LONG TRAIL（御坂・三ツ峠エリア NORTH）": [500, 503],
    "三ッ峠山・本社ヶ丸・鶴ヶ鳥屋山": [500, 503],
    "節刀ヶ岳・破風山・足和田山": [500, 503],
    "春日山・名所山・滝戸山": [500, 503],
    "釈迦ヶ岳・大栃山": [500, 503],
    "三方分山・パノラマ台": [500, 503],
    "達沢山・蜂城山・茶臼山": [500, 503],
    // 八ヶ岳
    "八ヶ岳（赤岳・硫黄岳・天狗岳）": [500,504],
    "浅間・八ヶ岳パノラマトレイル": [500,504],
    "浅間山・黒斑山・篭ノ登山": [500,504],
    "中山・中山砦": [500,504],
    "斑山": [500,504],
    "飯盛山": [500,504],
    // 白馬・鹿島槍・五竜
    "鹿島槍ヶ岳・五竜岳（五龍岳）・唐松岳": [500,505],
    "マウンテンドクター巡礼マップ（八方尾根〜唐松岳）": [500,505],
    // 槍・穂高・乗鞍
    "槍ヶ岳・穂高岳・上高地": [500,506],
    "燕岳・餓鬼岳・唐沢岳": [500,506],
    "乗鞍岳": [500,506],
    "水晶岳・薬師岳・黒部五郎岳・鷲羽岳・三俣蓮華岳・湯俣": [500,506],
    // 中央アルプス
    // 甲斐駒・北岳
    "黒河内岳（笹山）・白河内岳・白剥山": [500,508],
    "北岳・間ノ岳・農鳥岳": [500,508],
    "鳳凰山・地蔵岳・観音岳・薬師岳": [500,508],
    "仙丈ヶ岳・伊那荒倉岳": [500,508],
    "甲斐駒ヶ岳・日向山": [500,508],
    "雨乞岳": [500,508],

    // 東海
    // 伊豆・愛鷹
    "愛鷹山・大岳・黒岳": [600, 601],
    "FUJISAN LONG TRAIL（愛鷹・富士南麓エリア SOUTH）": [600, 601],
    "沼津アルプス・鷲頭山・香貫山": [600, 601],
    "古城山・大平山・伊東アルプス": [600, 601],
    "巣雲山": [600, 601],
    "岩戸山・日金山（十国峠）": [600, 601],
    "金冠山・達磨山・葛城山": [600, 601],
    "棚場山・魂の山・猫越岳": [600, 601],
    "矢筈山": [600, 601],
    "大室山": [600, 601],
    "小室山": [600, 601],
    "天城山・鉢ノ山・三筋山": [600, 601],
    "長九郎山": [600, 601],
    "婆娑羅山": [600, 601],
    "暗沢山・大峠・長者ヶ原": [600, 601],
    "南伊豆町": [600, 601],
    "高根山・寝姿山": [600, 601],
    // 塩見・赤石・聖
    "塩見岳・権右衛門山・蝙蝠岳": [600, 602],
    "荒川岳・東岳（悪沢岳）・前岳・中岳・赤石岳": [600, 602],

    // 必要に応じてさらに追加
    // ああ、手間がかかるなぁ
    
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

function yamaRecoStep2(jsonData) {

  const photoList = document.querySelectorAll('.photo_list .pcomment');
  
  if (photoList.length === 0) {
    alert("写真メモのテキスト入力欄が見つかりません。\n写真をアップロードしてから再度ボタンをクリックしてください。");
    return;
  }

  const photos = jsonData.photos;
  
  // photos配列の長さとtextareaの数を考慮して、少ない方の数でループを回す
  const minLength = Math.min(photos.length, photoList.length);
  
  for (let i = 0; i < minLength; i++) {
    const memo = photos[i].memo;      // JSONデータからメモを取得
    const textareaElm = photoList[i]; // メモ反映先のtextareaを取得
    textareaElm.value = memo;
  }
  
  console.log(`Inserted ${minLength} notes.`);

}

function yamaRecoStep4(jsonData) {

  const textareaElm = document.getElementById('impression');
  if (textareaElm) {
    textareaElm.value = jsonData.description;
  }

}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'recordStep1') {
    yamaRecoStep1(request.data);
  } else if (request.action === 'recordStep2') {
    yamaRecoStep2(request.data);
  } else if (request.action === 'recordStep4') {
    yamaRecoStep4(request.data);
  }
});