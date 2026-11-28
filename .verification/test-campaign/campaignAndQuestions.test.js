import test from "node:test";
import assert from "node:assert/strict";
import { createContext } from "react";
import { doc, getDocFromServer, getFirestore } from "firebase/firestore";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import "react/jsx-dev-runtime";
// src/data/questions/chineseQuestions.ts
var SLASH_DATA = [
	[
		"ch-3-s1",
		3,
		"upper",
		"「太陽公公對著大地微笑」運用了哪一種修辭？",
		[
			"擬人法",
			"誇飾法",
			"設問法",
			"排比法"
		],
		0,
		"將太陽賦予「微笑」的人類動作，屬於擬人法。",
		"想想看太陽真的會笑嗎？",
		"擬人修辭"
	],
	[
		"ch-3-s2",
		3,
		"upper",
		"「畫龍點□」形容關鍵一筆讓作品生動，空格應填？",
		[
			"睛",
			"晴",
			"精",
			"靖"
		],
		0,
		"「畫龍點睛」的「睛」是眼睛，目字旁。",
		"龍的眼睛要用目部！",
		"成語形近字"
	],
	[
		"ch-3-s3",
		3,
		"upper",
		"下列哪個詞語的「輕」字讀音正確？",
		[
			"輕快（ㄑㄧㄥ）",
			"輕快（ㄐㄧㄥ）",
			"輕快（ㄑㄧㄣ）",
			"輕快（ㄑㄧㄥˋ）"
		],
		0,
		"「輕」讀作 ㄑㄧㄥ，形容重量小或動作敏捷。",
		"聲母是 ㄑ，韻母是 ㄧㄥ。",
		"字音辨識"
	],
	[
		"ch-3-s4",
		3,
		"lower",
		"「一舉兩□」比喻做一件事得到兩種好處，空格應填？",
		[
			"得",
			"的",
			"德",
			"地"
		],
		0,
		"「一舉兩得」意指一次行動獲得兩項收穫。",
		"「得到」的得。",
		"成語應用"
	],
	[
		"ch-3-s5",
		3,
		"lower",
		"「他的臉紅得像熟透的蘋果」使用了哪種修辭？",
		[
			"譬喻法",
			"頂真法",
			"倒反法",
			"引用法"
		],
		0,
		"用「像」把紅臉比喻成蘋果，是明喻（譬喻法）。",
		"注意句中的「像」字！",
		"譬喻修辭"
	],
	[
		"ch-3-s6",
		3,
		"lower",
		"「再□再厲」形容繼續努力不鬆懈，空格應填？",
		[
			"接",
			"節",
			"結",
			"捷"
		],
		0,
		"「再接再厲」原指鬥雞磨嘴再戰，比喻持續奮進。",
		"是「接續」的接喔！",
		"成語形近字"
	],
	[
		"ch-4-s1",
		4,
		"upper",
		"「千山鳥飛絕，萬徑人蹤滅」描繪的是哪個季節？",
		[
			"冬季",
			"春季",
			"夏季",
			"秋季"
		],
		0,
		"出自柳宗元《江雪》，描寫嚴冬雪景寂靜。",
		"後兩句有「獨釣寒江雪」。",
		"古典詩詞"
	],
	[
		"ch-4-s2",
		4,
		"upper",
		"「半途而□」形容做事沒有堅持到底，空格應填？",
		[
			"廢",
			"費",
			"肺",
			"沸"
		],
		0,
		"「半途而廢」的「廢」是停止、荒廢之意。",
		"广部，不是貝部喔！",
		"成語形近字"
	],
	[
		"ch-4-s3",
		4,
		"upper",
		"「這個書包重得像一座山，快把我壓扁了！」主要運用？",
		[
			"誇飾法",
			"借代法",
			"雙關法",
			"映襯法"
		],
		0,
		"把書包形容成會壓扁人的大山，屬於誇飾修辭。",
		"明顯超越現實的誇大描述。",
		"誇飾修辭"
	],
	[
		"ch-4-s4",
		4,
		"lower",
		"「井底之蛙」常用來比喻什麼樣的人？",
		[
			"見識淺薄的人",
			"擅長游泳的人",
			"勇敢冒險的人",
			"勤勞節約的人"
		],
		0,
		"青蛙只在井裡看天，比喻眼界狹窄、見識短淺。",
		"想想青蛙在井裡只能看到多大的天空。",
		"寓言成語"
	],
	[
		"ch-4-s5",
		4,
		"lower",
		"「□心積慮」形容費盡心思策劃，空格應填？",
		[
			"處",
			"出",
			"除",
			"儲"
		],
		0,
		"「處心積慮」指長期存心謀劃，多用於貶義。",
		"讀作 ㄔㄨˇ。",
		"成語辨識"
	],
	[
		"ch-4-s6",
		4,
		"lower",
		"「春風又綠江南岸」中的「綠」字詞性轉為？",
		[
			"動詞",
			"名詞",
			"量詞",
			"連接詞"
		],
		0,
		"原為形容詞的「綠」，在詩中作「吹綠」解，為轉品動詞。",
		"春風把江南岸「吹綠」了！",
		"詞性轉品"
	],
	[
		"ch-5-s1",
		5,
		"upper",
		"「白日依山盡，黃河入海流」運用了哪種修辭技巧？",
		[
			"對偶法",
			"設問法",
			"倒反法",
			"回文法"
		],
		0,
		"「白日」對「黃河」，「依山盡」對「入海流」，字數相等結構對稱。",
		"上下兩句結構工整相對。",
		"對偶修辭"
	],
	[
		"ch-5-s2",
		5,
		"upper",
		"「破□沉舟」比喻下定決心不留退路，空格應填？",
		[
			"釜",
			"斧",
			"父",
			"府"
		],
		0,
		"「釜」是古代煮飯的鍋子，項羽砸破鍋具展現決心。",
		"是古代的鍋子，不是斧頭！",
		"歷史典故成語"
	],
	[
		"ch-5-s3",
		5,
		"upper",
		"「水能載舟，亦能覆舟」主要運用了哪種修辭？",
		[
			"映襯法",
			"類疊法",
			"頂真法",
			"借代法"
		],
		0,
		"將「載舟」與「覆舟」兩種相反結果並列對比，屬映襯法。",
		"一正一反強烈對照。",
		"映襯修辭"
	],
	[
		"ch-5-s4",
		5,
		"lower",
		"下列哪個成語最適合形容「文章寫得非常流暢精彩」？",
		[
			"行雲流水",
			"畫蛇添足",
			"掩耳盜鈴",
			"守株待兔"
		],
		0,
		"「行雲流水」比喻文筆或技藝自然流暢不受拘束。",
		"像雲彩與流水般自然。",
		"成語語境"
	],
	[
		"ch-5-s5",
		5,
		"lower",
		"「□耳盜鈴」比喻自欺欺人，空格應填？",
		[
			"掩",
			"淹",
			"醃",
			"演"
		],
		0,
		"「掩」是用手遮蓋，「掩耳盜鈴」指摀住自己耳朵偷鈴鐺。",
		"手部，代表用手遮住。",
		"成語形近字"
	],
	[
		"ch-5-s6",
		5,
		"lower",
		"「既生瑜，何生亮」屬於哪一種問句？",
		[
			"激問（反問）",
			"疑問",
			"提問",
			"感嘆"
		],
		0,
		"問而不需回答，答案就在反面（意指感嘆命運安排），屬激問。",
		"心裡其實已經有感嘆的情緒答案。",
		"設問修辭"
	],
	[
		"ch-6-s1",
		6,
		"upper",
		"「落紅不是無情物，化作春泥更護花」中「落紅」借代指？",
		[
			"落花",
			"夕陽",
			"楓葉",
			"紅布"
		],
		0,
		"以花瓣的紅色代稱「落花」，是古典詩詞常見借代法。",
		"後句有「更護花」作線索！",
		"借代修辭"
	],
	[
		"ch-6-s2",
		6,
		"upper",
		"「運籌□幄」比喻在幕後精心策劃，空格應填？",
		[
			"帷",
			"維",
			"唯",
			"違"
		],
		0,
		"「帷幄」指軍用帳幕，巾部與布幕有關。",
		"與帳篷布幕有關，選巾部！",
		"成語形近字"
	],
	[
		"ch-6-s3",
		6,
		"upper",
		"「三人行，必有我師焉」出自哪部經典？",
		[
			"論語",
			"孟子",
			"莊子",
			"史記"
		],
		0,
		"此句為孔子名言，收錄於《論語・述而》。",
		"記錄孔子與弟子言行的經典。",
		"國學常識"
	],
	[
		"ch-6-s4",
		6,
		"lower",
		"「名落孫山」用來形容什麼情境？",
		[
			"考試沒有錄取",
			"登上高山山頂",
			"名聲傳遍天下",
			"書法獲得第一"
		],
		0,
		"典故中孫山考最後一名，落榜者排在孫山之後，故稱名落孫山。",
		"「落」代表沒上榜喔！",
		"歷史典故成語"
	],
	[
		"ch-6-s5",
		6,
		"lower",
		"「學而不思則罔，思而不學則□」空格應填？",
		[
			"殆",
			"怠",
			"待",
			"代"
		],
		0,
		"「殆」為危殆、疑惑之意，強調學習與思考並重。",
		"歹部，表示危險與迷惘。",
		"論語名句"
	],
	[
		"ch-6-s6",
		6,
		"lower",
		"「一傅眾咻」的寓意最接近下列何者？",
		[
			"環境影響學習甚鉅",
			"團結合作力量大",
			"勤能補拙必成功",
			"尊師重道不可忘"
		],
		0,
		"一人教導卻有眾人干擾喧鬧，比喻學習環境的重要性。",
		"一位老師教，旁邊很多人吵鬧。",
		"文言成語"
	]
];
var RADICAL_DATA = [
	[
		"ch-3-r1",
		3,
		"upper",
		"氵",
		"青",
		"清",
		[
			"氵",
			"青",
			"日",
			"言",
			"目"
		],
		"清澈乾淨的「清」",
		"水部加上青字，組成與水乾淨有關的字。",
		"水非常乾淨透明，需要「氵」！",
		"部件拼字・水部"
	],
	[
		"ch-3-r2",
		3,
		"upper",
		"日",
		"青",
		"晴",
		[
			"日",
			"青",
			"氵",
			"心",
			"木"
		],
		"放晴天朗的「晴」",
		"日部加青字，表示太陽出來天空蔚藍。",
		"好天氣要有太陽「日」！",
		"部件拼字・日部"
	],
	[
		"ch-3-r3",
		3,
		"lower",
		"訁",
		"成",
		"誠",
		[
			"訁",
			"成",
			"土",
			"氵",
			"火"
		],
		"誠實守信的「誠」",
		"言字旁加「成」，代表說話真誠守信。",
		"說話要真誠，偏旁是「訁」。",
		"部件拼字・言部"
	],
	[
		"ch-3-r4",
		3,
		"lower",
		"木",
		"喬",
		"橋",
		[
			"木",
			"喬",
			"氵",
			"石",
			"禾"
		],
		"跨越河流的「橋」",
		"古代橋梁多以木材建造，故為木部加「喬」。",
		"古代建築多用木頭「木」。",
		"部件拼字・木部"
	],
	[
		"ch-4-r1",
		4,
		"upper",
		"心",
		"青",
		"情",
		[
			"忄",
			"青",
			"日",
			"氵",
			"目"
		],
		"感情心情的「情」",
		"豎心旁「忄」加上「青」，表示內心的情感。",
		"感受與情緒藏在心裡，找「忄」！",
		"部件拼字・心部"
	],
	[
		"ch-4-r2",
		4,
		"upper",
		"土",
		"成",
		"城",
		[
			"土",
			"成",
			"訁",
			"木",
			"火"
		],
		"堅固城牆的「城」",
		"古代城牆由泥土夯築，故從「土」加「成」。",
		"建造城牆需要泥土「土」！",
		"部件拼字・土部"
	],
	[
		"ch-4-r3",
		4,
		"lower",
		"目",
		"青",
		"睛",
		[
			"目",
			"青",
			"日",
			"氵",
			"訁"
		],
		"眼睛瞳孔的「睛」",
		"目部加「青」，組成「眼睛」的睛。",
		"眼睛相關一定找「目」！",
		"部件拼字・目部"
	],
	[
		"ch-4-r4",
		4,
		"lower",
		"氵",
		"莫",
		"漠",
		[
			"氵",
			"莫",
			"艹",
			"木",
			"土"
		],
		"浩瀚沙漠的「漠」",
		"「漠」原指北方流沙如水波，從氵加莫。",
		"雖然乾燥，卻是三點水「氵」喔！",
		"部件拼字・形聲字"
	],
	[
		"ch-5-r1",
		5,
		"upper",
		"訁",
		"義",
		"議",
		[
			"訁",
			"義",
			"儀",
			"亻",
			"氵"
		],
		"討論會議的「議」",
		"言部加「義」，代表用言語討論商議。",
		"開會討論靠說話，選「訁」！",
		"部件拼字・形聲字"
	],
	[
		"ch-5-r2",
		5,
		"upper",
		"火",
		"燥",
		"燥",
		[
			"火",
			"喿",
			"氵",
			"木",
			"口"
		],
		"乾燥缺水的「燥」",
		"火部加「喿」，表示因火烘烤而乾燥。",
		"天氣熱又乾，找「火」和「喿」！",
		"部件拼字・火部"
	],
	[
		"ch-5-r3",
		5,
		"lower",
		"扌",
		"采",
		"採",
		[
			"扌",
			"采",
			"木",
			"氵",
			"彡"
		],
		"採摘果實的「採」",
		"提手旁「扌」加「采」，強調用手摘取。",
		"用手摘花摘果，找「扌」！",
		"部件拼字・手部"
	],
	[
		"ch-5-r4",
		5,
		"lower",
		"糸",
		"合",
		"給",
		[
			"糸",
			"合",
			"亻",
			"口",
			"氵"
		],
		"供給贈與的「給」",
		"糸部加「合」，原指衣食充裕供給。",
		"部首是絲字旁「糸」喔！",
		"部件拼字・糸部"
	],
	[
		"ch-6-r1",
		6,
		"upper",
		"亻",
		"義",
		"儀",
		[
			"亻",
			"義",
			"訁",
			"木",
			"氵"
		],
		"禮儀儀表的「儀」",
		"人部加「義」，指人的舉止風度與法度。",
		"與人的姿態舉止有關，找「亻」！",
		"部件拼字・人部"
	],
	[
		"ch-6-r2",
		6,
		"upper",
		"氵",
		"喿",
		"澡",
		[
			"氵",
			"喿",
			"火",
			"足",
			"木"
		],
		"沐浴洗澡的「澡」",
		"水部加「喿」，表示用水洗淨身體。",
		"洗澡一定需要水「氵」！",
		"部件拼字・水部"
	],
	[
		"ch-6-r3",
		6,
		"lower",
		"金",
		"竟",
		"鏡",
		[
			"金",
			"竟",
			"土",
			"石",
			"木"
		],
		"明鏡高懸的「鏡」",
		"古代鏡子以青銅鑄造，故從「金」加「竟」。",
		"古代用銅鑄造鏡子，找「金」！",
		"部件拼字・金部"
	],
	[
		"ch-6-r4",
		6,
		"lower",
		"訁",
		"戒",
		"誡",
		[
			"訁",
			"戒",
			"扌",
			"心",
			"木"
		],
		"告誡勸勉的「誡」",
		"言部加「戒」，指用言語提醒警戒。",
		"用言語勸導提醒，找「訁」！",
		"部件拼字・言部"
	]
];
var CLEAN_TYPO_DATA = [
	[
		"ch-3-t1",
		3,
		"upper",
		"小明在公園裡高興的放風針。",
		11,
		"針",
		"箏",
		"「風箏」是竹部，不是金部的「針」。",
		"最後一個字怪怪的喔！",
		"錯別字辨識"
	],
	[
		"ch-3-t2",
		3,
		"upper",
		"今天天氣很睛朗，適合去郊遊。",
		5,
		"睛",
		"晴",
		"「晴朗」與太陽有關，應為日部的「晴」。",
		"檢查「睛朗」的部首！",
		"錯別字辨識"
	],
	[
		"ch-3-t3",
		3,
		"lower",
		"我決定以後一定要克苦耐勞。",
		8,
		"克",
		"刻",
		"「刻苦耐勞」應作「刻」，意指嚴格要求自己。",
		"注意成語第一個字。",
		"成語錯別字"
	],
	[
		"ch-3-t4",
		3,
		"lower",
		"妹妹畫了一張非常精采的圖畫。",
		9,
		"采",
		"彩",
		"形容色澤或表現豐富，現代標準用字常作「精彩」。",
		"想想圖畫的色彩！",
		"常用字辨析"
	],
	[
		"ch-4-t1",
		4,
		"upper",
		"他做事總是半途而費，真可惜。",
		8,
		"費",
		"廢",
		"「半途而廢」的「廢」是停止荒廢，不是花費的「費」。",
		"檢查成語最後一個字！",
		"成語錯別字"
	],
	[
		"ch-4-t2",
		4,
		"upper",
		"這篇文章寫得真是栩栩如深。",
		11,
		"深",
		"生",
		"「栩栩如生」形容生動逼真，像活的一樣。",
		"最後一個字音近寫錯了！",
		"成語錯別字"
	],
	[
		"ch-4-t3",
		4,
		"lower",
		"我們應該珍惜時間，不要浪費光陰。",
		2,
		"應",
		"應",
		"本題請找出錯字—改用下一句。",
		"細心檢視每個字。",
		"錯別字辨識"
	],
	[
		"ch-4-t4",
		4,
		"lower",
		"聽到好消息，大家高興得手舞足導。",
		14,
		"導",
		"蹈",
		"「手舞足蹈」的「蹈」是足部，表示腳步跳動。",
		"腳在跳動應該是什麼部首？",
		"成語錯別字"
	],
	[
		"ch-5-t1",
		5,
		"upper",
		"他對朋友總是迫不及待的伸出援手。",
		5,
		"迫",
		"迫",
		"檢查錯字。",
		"細看字形。",
		"錯別字辨識"
	],
	[
		"ch-5-t2",
		5,
		"upper",
		"這座古蹟在地震中瞬間灰飛煙面。",
		13,
		"面",
		"滅",
		"「灰飛煙滅」意指徹底消散，應為「滅」。",
		"最後一個字錯了！",
		"成語錯別字"
	],
	[
		"ch-5-t3",
		5,
		"lower",
		"面對困難，我們必須再接再勵。",
		12,
		"勵",
		"厲",
		"「再接再厲」的「厲」是磨刀石之意，不是鼓勵的「勵」。",
		"檢查成語最後一字！",
		"成語錯別字"
	],
	[
		"ch-5-t4",
		5,
		"lower",
		"這場演講精彩絕倫，令人拍按叫絕。",
		12,
		"按",
		"案",
		"「拍案叫絕」是指拍著桌子稱讚，應為木部的「案」。",
		"古時候桌子叫做「案」喔！",
		"成語錯別字"
	],
	[
		"ch-6-t1",
		6,
		"upper",
		"這起事件真相大白，真是水落石初。",
		14,
		"初",
		"出",
		"「水落石出」形容真相顯露，應為「出」。",
		"檢查成語最後一個字。",
		"成語錯別字"
	],
	[
		"ch-6-t2",
		6,
		"upper",
		"他總是隨聲附合，缺乏獨立思考。",
		6,
		"合",
		"和",
		"「隨聲附和」指跟著別人唱和應聲，應作「和」。",
		"檢查「附合」第二字！",
		"成語錯別字"
	],
	[
		"ch-6-t3",
		6,
		"lower",
		"這段歷史讓人不寒而立，深感警惕。",
		9,
		"立",
		"慄",
		"「不寒而慄」形容恐懼發抖，應為心部的「慄」。",
		"害怕發抖跟心情有關！",
		"成語錯別字"
	],
	[
		"ch-6-t4",
		6,
		"lower",
		"選手們個個摩拳擦長，準備迎戰。",
		8,
		"長",
		"掌",
		"「摩拳擦掌」意指搓揉手掌準備行動，應為「掌」。",
		"檢查「擦長」二字！",
		"成語錯別字"
	]
].map((item) => {
	if (item[0] === "ch-4-t3") return [
		"ch-4-t3",
		4,
		"lower",
		"我們應該珍惜光音，認真學習。",
		7,
		"音",
		"陰",
		"「光陰」指時間，不是聲音的「音」。",
		"「一寸光陰一寸金」的陰！",
		"錯別字辨識"
	];
	if (item[0] === "ch-5-t1") return [
		"ch-5-t1",
		5,
		"upper",
		"運動會開幕時，操場上人山人悔。",
		13,
		"悔",
		"海",
		"「人山人海」形容人潮非常眾多，應為水部的「海」。",
		"檢查最後一個字！",
		"成語錯別字"
	];
	return item;
});
var CHINESE_QUESTIONS$1 = [
	...SLASH_DATA.map(([id, grade, semester, prompt, options, correctIndex, explanation, hint, knowledgeTag]) => ({
		id,
		grade,
		semester,
		subject: "chinese",
		type: "slash",
		prompt,
		answer: options[correctIndex],
		explanation,
		hint,
		knowledgeTag,
		payload: {
			mode: "slash",
			options,
			correctIndex
		}
	})),
	...RADICAL_DATA.map(([id, grade, semester, partA, partB, targetChar, pool, meaning, explanation, hint, knowledgeTag]) => {
		const normalizedA = partA === "心" && targetChar === "情" ? "忄" : partA;
		const normalizedB = partB === "燥" && targetChar === "燥" ? "喿" : partB;
		return {
			id,
			grade,
			semester,
			subject: "chinese",
			type: "radical",
			prompt: `請選出正確的兩個部件，拼出「${meaning}」！`,
			answer: `${normalizedA}＋${normalizedB}＝${targetChar}`,
			explanation,
			hint,
			knowledgeTag,
			payload: {
				mode: "radical",
				partA: normalizedA,
				partB: normalizedB,
				pool,
				targetChar,
				meaning
			}
		};
	}),
	...CLEAN_TYPO_DATA.map(([id, grade, semester, sentence, typoIndex, wrongChar, correctChar, explanation, hint, knowledgeTag]) => ({
		id,
		grade,
		semester,
		subject: "chinese",
		type: "typo",
		prompt: "點擊石碑句子中的「錯別字」，一刀斬碎破盾！",
		answer: `「${wrongChar}」應改為「${correctChar}」`,
		explanation,
		hint,
		knowledgeTag,
		payload: {
			mode: "typo",
			sentence,
			typoIndex,
			wrongChar,
			correctChar
		}
	}))
];
// src/data/questions/englishQuestions.ts
var DRONE_DATA = [
	[
		"en-3-d1",
		3,
		"upper",
		"listen",
		"聽音辨字：擊落正確的英文單字機！",
		"Elephant",
		"大象",
		[
			"Elephant",
			"Rabbit",
			"Monkey",
			"Tiger"
		],
		0,
		"Elephant 是大象，發音以 /ɛ/ 開頭。",
		"仔細聽開頭的 E-le-phant！",
		"動物單字"
	],
	[
		"en-3-d2",
		3,
		"upper",
		"listen",
		"聽音辨字：擊落正確的水果單字機！",
		"Banana",
		"香蕉",
		[
			"Apple",
			"Banana",
			"Orange",
			"Grape"
		],
		1,
		"Banana 是香蕉，注意三個音節 ba-na-na。",
		"結尾有 na-na 的聲音！",
		"水果單字"
	],
	[
		"en-3-d3",
		3,
		"upper",
		"fill",
		"句子填空：I ___ a student.",
		"I am a student.",
		"我是一名學生。",
		[
			"am",
			"is",
			"are",
			"be"
		],
		0,
		"第一人稱單數 I 搭配 be 動詞 am。",
		"I 永遠和 am 是好朋友！",
		"Be 動詞"
	],
	[
		"en-3-d4",
		3,
		"upper",
		"fill",
		"句子填空：What ___ your name?",
		"What is your name?",
		"你叫什麼名字？",
		[
			"is",
			"are",
			"am",
			"do"
		],
		0,
		"your name 為單數名詞，搭配 is。",
		"單數主詞配 is。",
		"問句結構"
	],
	[
		"en-3-d5",
		3,
		"lower",
		"listen",
		"聽音辨字：擊落正確的顏色單字機！",
		"Yellow",
		"黃色",
		[
			"Green",
			"Purple",
			"Yellow",
			"Black"
		],
		2,
		"Yellow 代表黃色。",
		"聽起來像「葉樓」的開頭 Y！",
		"顏色單字"
	],
	[
		"en-3-d6",
		3,
		"lower",
		"fill",
		"句子填空：This is ___ apple.",
		"This is an apple.",
		"這是一顆蘋果。",
		[
			"an",
			"a",
			"two",
			"are"
		],
		0,
		"apple 以母音 /æ/ 開頭，不定冠詞用 an。",
		"母音開頭的單字前面用 an！",
		"冠詞 a/an"
	],
	[
		"en-3-d7",
		3,
		"lower",
		"listen",
		"聽音辨字：擊落正確的教室用品機！",
		"Pencil",
		"鉛筆",
		[
			"Ruler",
			"Eraser",
			"Pencil",
			"Book"
		],
		2,
		"Pencil 是鉛筆，Pen 是原子筆。",
		"開頭是 Pen-！",
		"文具單字"
	],
	[
		"en-3-d8",
		3,
		"lower",
		"fill",
		"句子填空：How old ___ you?",
		"How old are you?",
		"你幾歲？",
		[
			"are",
			"is",
			"am",
			"has"
		],
		0,
		"第二人稱 you 搭配 be 動詞 are。",
		"you 搭配 are！",
		"Be 動詞"
	],
	[
		"en-3-d9",
		3,
		"upper",
		"listen",
		"聽音辨字：擊落正確的家人稱謂機！",
		"Mother",
		"媽媽",
		[
			"Father",
			"Mother",
			"Sister",
			"Brother"
		],
		1,
		"Mother 指母親、媽媽。",
		"以 M 開頭的單字！",
		"家庭單字"
	],
	[
		"en-3-d10",
		3,
		"lower",
		"fill",
		"句子填空：It is a red ___.",
		"It is a red ball.",
		"它是一顆紅球。",
		[
			"ball",
			"blue",
			"run",
			"happy"
		],
		0,
		"形容詞 red 後面應接名詞 ball。",
		"找一個名詞當受詞！",
		"名詞與形容詞"
	],
	[
		"en-4-d1",
		4,
		"upper",
		"fill",
		"句子填空：She ___ to school every day.",
		"She goes to school every day.",
		"她每天去上學。",
		[
			"goes",
			"go",
			"going",
			"went"
		],
		0,
		"現在簡單式第三人稱單數 She，動詞 go 須加 es 變 goes。",
		"主詞是 She，動詞要加 s/es！",
		"第三人稱單數"
	],
	[
		"en-4-d2",
		4,
		"upper",
		"listen",
		"聽音辨字：擊落正確的天氣單字機！",
		"Rainy",
		"下雨的",
		[
			"Sunny",
			"Windy",
			"Rainy",
			"Cloudy"
		],
		2,
		"Rainy 表示下雨的（Rain + y）。",
		"聽看看有沒有 Rain（雨）的聲音！",
		"天氣形容詞"
	],
	[
		"en-4-d3",
		4,
		"upper",
		"fill",
		"句子填空：Can you ___ a bike?",
		"Can you ride a bike?",
		"你會騎腳踏車嗎？",
		[
			"ride",
			"rides",
			"riding",
			"rode"
		],
		0,
		"助動詞 Can 後面必須接原形動詞 ride。",
		"Can 後面用原形動詞！",
		"助動詞 Can"
	],
	[
		"en-4-d4",
		4,
		"upper",
		"listen",
		"聽音辨字：擊落正確的星期單字機！",
		"Wednesday",
		"星期三",
		[
			"Monday",
			"Tuesday",
			"Wednesday",
			"Friday"
		],
		2,
		"Wednesday 是星期三，中間的 d 不發音。",
		"發音像 Wenz-day！",
		"星期單字"
	],
	[
		"en-4-d5",
		4,
		"lower",
		"fill",
		"句子填空：What ___ you doing now?",
		"What are you doing now?",
		"你現在正在做什麼？",
		[
			"are",
			"do",
			"is",
			"can"
		],
		0,
		"現在進行式結構為 be 動詞 + V-ing，主詞 you 用 are。",
		"看到 doing 要找 be 動詞！",
		"現在進行式"
	],
	[
		"en-4-d6",
		4,
		"lower",
		"listen",
		"聽音辨字：擊落正確的場所單字機！",
		"Library",
		"圖書館",
		[
			"Hospital",
			"Library",
			"Park",
			"Zoo"
		],
		1,
		"Library 是圖書館。",
		"Lie-bra-ry！",
		"場所單字"
	],
	[
		"en-4-d7",
		4,
		"lower",
		"fill",
		"句子填空：There ___ three cats on the sofa.",
		"There are three cats on the sofa.",
		"沙發上有三隻貓。",
		[
			"are",
			"is",
			"am",
			"have"
		],
		0,
		"three cats 是複數，There be 句型用 There are。",
		"三隻貓是複數喔！",
		"There be 句型"
	],
	[
		"en-4-d8",
		4,
		"lower",
		"listen",
		"聽音辨字：擊落正確的食物單字機！",
		"Noodles",
		"麵條",
		[
			"Rice",
			"Soup",
			"Noodles",
			"Salad"
		],
		2,
		"Noodles 表示麵條，常用複數形。",
		"開頭是 N-oo-！",
		"飲食單字"
	],
	[
		"en-4-d9",
		4,
		"upper",
		"fill",
		"句子填空：He ___ like spiders.",
		"He does not like spiders.",
		"他不喜歡蜘蛛。",
		[
			"doesn't",
			"don't",
			"isn't",
			"aren't"
		],
		0,
		"第三人稱單數 He 的一般動詞否定用 doesn’t。",
		"He 搭配 does！",
		"一般動詞否定"
	],
	[
		"en-4-d10",
		4,
		"lower",
		"fill",
		"句子填空：Where ___ my keys?",
		"Where are my keys?",
		"我的鑰匙在哪裡？",
		[
			"are",
			"is",
			"am",
			"does"
		],
		0,
		"keys 有 s 為複數名詞，搭配 are。",
		"keys 是複數！",
		"複數疑問句"
	],
	[
		"en-5-d1",
		5,
		"upper",
		"fill",
		"句子填空：I ___ to Taipei yesterday.",
		"I went to Taipei yesterday.",
		"我昨天去了台北。",
		[
			"went",
			"go",
			"goes",
			"going"
		],
		0,
		"時間副詞 yesterday 表示過去，go 的過去式是 went。",
		"看到 yesterday 要用過去式！",
		"不規則過去式"
	],
	[
		"en-5-d2",
		5,
		"upper",
		"listen",
		"聽音辨字：擊落正確的職業單字機！",
		"Scientist",
		"科學家",
		[
			"Doctor",
			"Teacher",
			"Scientist",
			"Pilot"
		],
		2,
		"Scientist 意指科學家。",
		"與 Science 科學相關！",
		"職業單字"
	],
	[
		"en-5-d3",
		5,
		"upper",
		"fill",
		"句子填空：How ___ water do you need?",
		"How much water do you need?",
		"你需要多少水？",
		[
			"much",
			"many",
			"old",
			"tall"
		],
		0,
		"water 為不可數名詞，詢問數量用 How much。",
		"水是不可數名詞喔！",
		"可數與不可數"
	],
	[
		"en-5-d4",
		5,
		"upper",
		"listen",
		"聽音辨字：擊落正確的季節單字機！",
		"Autumn",
		"秋天",
		[
			"Spring",
			"Summer",
			"Autumn",
			"Winter"
		],
		2,
		"Autumn（或 Fall）是秋天，字尾 n 不發音。",
		"發音像 Aw-tum！",
		"季節單字"
	],
	[
		"en-5-d5",
		5,
		"lower",
		"fill",
		"句子填空：She is ___ than her brother.",
		"She is taller than her brother.",
		"她比她的哥哥高。",
		[
			"taller",
			"tall",
			"tallest",
			"more tall"
		],
		0,
		"句中有 than 表兩者比較，單音節形容詞加 er 變 taller。",
		"看到 than 就選比較級 -er！",
		"形容詞比較級"
	],
	[
		"en-5-d6",
		5,
		"lower",
		"listen",
		"聽音辨字：擊落正確的交通工具機！",
		"Subway",
		"捷運／地鐵",
		[
			"Airplane",
			"Subway",
			"Bicycle",
			"Scooter"
		],
		1,
		"Subway 指地鐵或捷運系統。",
		"Sub- 表示在地下！",
		"交通單字"
	],
	[
		"en-5-d7",
		5,
		"lower",
		"fill",
		"句子填空：We ___ going to visit the museum.",
		"We are going to visit the museum.",
		"我們打算去參觀博物館。",
		[
			"are",
			"is",
			"will",
			"did"
		],
		0,
		"be going to 表示未來計畫，We 搭配 are。",
		"be going to 缺了 be 動詞！",
		"未來式"
	],
	[
		"en-5-d8",
		5,
		"lower",
		"listen",
		"聽音辨字：擊落正確的科目單字機！",
		"Geography",
		"地理",
		[
			"History",
			"Music",
			"Geography",
			"Science"
		],
		2,
		"Geography 是地理學科。",
		"Geo- 代表地球！",
		"學科單字"
	],
	[
		"en-5-d9",
		5,
		"upper",
		"fill",
		"句子填空：Did you ___ your homework?",
		"Did you finish your homework?",
		"你完成作業了嗎？",
		[
			"finish",
			"finished",
			"finishes",
			"finishing"
		],
		0,
		"過去式助動詞 Did 後面要接原形動詞 finish。",
		"Did 後面動詞變回原形！",
		"過去式疑問句"
	],
	[
		"en-5-d10",
		5,
		"lower",
		"fill",
		"句子填空：My birthday is ___ October.",
		"My birthday is in October.",
		"我的生日在十月。",
		[
			"in",
			"on",
			"at",
			"to"
		],
		0,
		"月份前使用時間介系詞 in。",
		"年、季、月前面都用 in！",
		"時間介系詞"
	],
	[
		"en-6-d1",
		6,
		"upper",
		"fill",
		"句子填空：Mount Jade is the ___ mountain in Taiwan.",
		"Mount Jade is the highest mountain in Taiwan.",
		"玉山是台灣最高的山。",
		[
			"highest",
			"higher",
			"high",
			"most high"
		],
		0,
		"the + 最高級表示三者以上之最，high 的最高級為 highest。",
		"前面有 the，選最高級 -est！",
		"形容詞最高級"
	],
	[
		"en-6-d2",
		6,
		"upper",
		"listen",
		"聽音辨字：擊落正確的環保單字機！",
		"Recycle",
		"回收再利用",
		[
			"Recycle",
			"Pollute",
			"Protect",
			"Energy"
		],
		0,
		"Recycle 意指資源回收再利用。",
		"Re- 表示再次循環！",
		"環境議題單字"
	],
	[
		"en-6-d3",
		6,
		"upper",
		"fill",
		"句子填空：If it ___ tomorrow, we will stay home.",
		"If it rains tomorrow, we will stay home.",
		"如果明天下雨，我們就待在家。",
		[
			"rains",
			"will rain",
			"rained",
			"raining"
		],
		0,
		"If 引導的條件副詞子句以現在簡單式代替未來式，主詞 it 用 rains。",
		"If 子句用現在式代替未來式！",
		"條件句時態"
	],
	[
		"en-6-d4",
		6,
		"upper",
		"listen",
		"聽音辨字：擊落正確的太空單字機！",
		"Astronaut",
		"太空人",
		[
			"Planet",
			"Astronaut",
			"Rocket",
			"Galaxy"
		],
		1,
		"Astronaut 是太空人。",
		"Astro- 與星辰有關！",
		"宇宙科技單字"
	],
	[
		"en-6-d5",
		6,
		"lower",
		"fill",
		"句子填空：I have ___ this movie twice.",
		"I have seen this movie twice.",
		"這部電影我看過兩次了。",
		[
			"seen",
			"saw",
			"see",
			"seeing"
		],
		0,
		"現在完成式 have + 過去分詞(p.p.)，see 的 p.p. 是 seen。",
		"have 後面接過去分詞！",
		"現在完成式"
	],
	[
		"en-6-d6",
		6,
		"lower",
		"listen",
		"聽音辨字：擊落正確的感受單字機！",
		"Excited",
		"興奮的",
		[
			"Bored",
			"Worried",
			"Excited",
			"Surprised"
		],
		2,
		"Excited 形容人感到興奮激動。",
		"Ex-ci-ted！",
		"情緒形容詞"
	],
	[
		"en-6-d7",
		6,
		"lower",
		"fill",
		"句子填空：She enjoys ___ English songs.",
		"She enjoys singing English songs.",
		"她喜歡唱英文歌。",
		[
			"singing",
			"to sing",
			"sing",
			"sang"
		],
		0,
		"動詞 enjoy 後面必須接動名詞 V-ing。",
		"enjoy + V-ing 是必考搭配！",
		"動名詞用法"
	],
	[
		"en-6-d8",
		6,
		"lower",
		"listen",
		"聽音辨字：擊落正確的探索單字機！",
		"Adventure",
		"冒險",
		[
			"Adventure",
			"Festival",
			"Vacation",
			"Culture"
		],
		0,
		"Adventure 表示冒險旅程。",
		"Ad-ven-ture！",
		"旅遊冒險單字"
	],
	[
		"en-6-d9",
		6,
		"upper",
		"fill",
		"句子填空：The book was ___ by a famous writer.",
		"The book was written by a famous writer.",
		"這本書是一位知名作家寫的。",
		[
			"written",
			"wrote",
			"write",
			"writing"
		],
		0,
		"被動語態 be + p.p.，write 的過去分詞是 written。",
		"被動語態用 was + p.p.！",
		"被動語態"
	],
	[
		"en-6-d10",
		6,
		"lower",
		"fill",
		"句子填空：Although he was tired, ___ he kept running.",
		"Although he was tired, he kept running.",
		"雖然他很累，但他還是繼續跑。",
		[
			"(不填)",
			"but",
			"so",
			"because"
		],
		0,
		"英文中 Although 與 but 不可同時出現在同一個句子裡。",
		"英文的雖然跟但是不能同時出現喔！",
		"連接詞規則"
	]
];
var SPELL_DATA = [
	[
		"en-3-sp1",
		3,
		"upper",
		"APPLE",
		"蘋果",
		["O", "M"],
		"APPLE 拼法為 A-P-P-L-E，注意兩個 P。",
		"水果拼字"
	],
	[
		"en-3-sp2",
		3,
		"upper",
		"TIGER",
		"老虎",
		["A", "O"],
		"TIGER 拼法為 T-I-G-E-R。",
		"動物拼字"
	],
	[
		"en-3-sp3",
		3,
		"lower",
		"WATER",
		"水",
		["O", "N"],
		"WATER 拼法為 W-A-T-E-R。",
		"生活拼字"
	],
	[
		"en-3-sp4",
		3,
		"lower",
		"HAPPY",
		"快樂的",
		["E", "I"],
		"HAPPY 拼法為 H-A-P-P-Y。",
		"情緒拼字"
	],
	[
		"en-4-sp1",
		4,
		"upper",
		"SUNNY",
		"晴朗的",
		["A", "O"],
		"SUNNY 是 SUN 雙寫 N 加 Y。",
		"天氣拼字"
	],
	[
		"en-4-sp2",
		4,
		"upper",
		"ROBOT",
		"機器人",
		["A", "E"],
		"ROBOT 拼法為 R-O-B-O-T。",
		"科技拼字"
	],
	[
		"en-4-sp3",
		4,
		"lower",
		"MUSIC",
		"音樂",
		["K", "A"],
		"MUSIC 拼法為 M-U-S-I-C。",
		"學科拼字"
	],
	[
		"en-4-sp4",
		4,
		"lower",
		"TRAIN",
		"火車",
		["E", "O"],
		"TRAIN 拼法為 T-R-A-I-N，ai 發長音。",
		"交通拼字"
	],
	[
		"en-5-sp1",
		5,
		"upper",
		"PLANET",
		"行星",
		["O", "I"],
		"PLANET 拼法為 P-L-A-N-E-T。",
		"太空拼字"
	],
	[
		"en-5-sp2",
		5,
		"upper",
		"FOREST",
		"森林",
		["A", "U"],
		"FOREST 拼法為 F-O-R-E-S-T。",
		"自然拼字"
	],
	[
		"en-5-sp3",
		5,
		"lower",
		"FRIEND",
		"朋友",
		["A", "O"],
		"FRIEND 拼法為 F-R-I-E-N-D，注意 ie 順序。",
		"生活拼字"
	],
	[
		"en-5-sp4",
		5,
		"lower",
		"SPRING",
		"春天",
		["E", "A"],
		"SPRING 拼法為 S-P-R-I-N-G。",
		"季節拼字"
	],
	[
		"en-6-sp1",
		6,
		"upper",
		"GALAXY",
		"銀河系",
		["E", "O"],
		"GALAXY 拼法為 G-A-L-A-X-Y。",
		"宇宙拼字"
	],
	[
		"en-6-sp2",
		6,
		"upper",
		"ENERGY",
		"能源",
		["A", "I"],
		"ENERGY 拼法為 E-N-E-R-G-Y。",
		"科學拼字"
	],
	[
		"en-6-sp3",
		6,
		"lower",
		"FUTURE",
		"未來",
		["A", "O"],
		"FUTURE 拼法為 F-U-T-U-R-E。",
		"時間拼字"
	],
	[
		"en-6-sp4",
		6,
		"lower",
		"HEROIC",
		"英勇的",
		["A", "U"],
		"HEROIC 由 HERO 加上 IC 構成。",
		"進階形容詞"
	]
];
var ENGLISH_QUESTIONS$1 = [...DRONE_DATA.map(([id, grade, semester, mode, prompt, speakText, zhMeaning, choices, correctIndex, explanation, hint, knowledgeTag]) => ({
	id,
	grade,
	semester,
	subject: "english",
	type: mode,
	prompt,
	answer: choices[correctIndex],
	explanation,
	hint,
	knowledgeTag,
	payload: {
		mode,
		speakText,
		zhMeaning,
		choices,
		correctIndex
	}
})), ...SPELL_DATA.map(([id, grade, semester, word, zhMeaning, distractorLetters, explanation, knowledgeTag]) => ({
	id,
	grade,
	semester,
	subject: "english",
	type: "spell",
	prompt: `母艦拼字充能！依序射擊字母拼出「${zhMeaning}」`,
	answer: word,
	explanation,
	hint: `開頭字母是 ${word[0]}，共有 ${word.length} 個字母！`,
	knowledgeTag,
	payload: {
		mode: "spell",
		speakText: word.toLowerCase(),
		zhMeaning,
		word,
		distractorLetters
	}
}))];
var MATH_QUESTIONS$1 = [
	[
		"ma-3-1",
		3,
		"upper",
		"calc",
		"348 + 275 = ?",
		"348 + 275",
		[
			"623",
			"613",
			"523",
			"633"
		],
		0,
		"個位 8+5=13 進1，十位 4+7+1=12 進1，百位 3+2+1=6，得 623。",
		"記得個位與十位都要進位喔！",
		"三位數加法"
	],
	[
		"ma-3-2",
		3,
		"upper",
		"calc",
		"700 - 246 = ?",
		"700 - 246",
		[
			"454",
			"464",
			"554",
			"444"
		],
		0,
		"700 - 200 = 500，500 - 46 = 454。",
		"可用 699 - 246 + 1 快速驗算！",
		"連續退位減法"
	],
	[
		"ma-3-3",
		3,
		"upper",
		"calc",
		"36 × 4 = ?",
		"36 × 4",
		[
			"144",
			"124",
			"134",
			"154"
		],
		0,
		"30×4=120，6×4=24，120+24=144。",
		"拆成 30×4 和 6×4 再相加！",
		"二位數乘法"
	],
	[
		"ma-3-4",
		3,
		"upper",
		"calc",
		"84 ÷ 7 = ?",
		"84 ÷ 7",
		[
			"12",
			"11",
			"13",
			"14"
		],
		0,
		"7×10=70，剩 14，14÷7=2，合起來 12。",
		"想想 7 乘以多少等於 84？",
		"二位數除法"
	],
	[
		"ma-3-5",
		3,
		"upper",
		"geometry",
		"邊長 9 公分的正方形，周長是多少公分？",
		"正方形邊長9→周長",
		[
			"36",
			"18",
			"81",
			"27"
		],
		0,
		"正方形四邊等長，周長 = 9 × 4 = 36 公分。",
		"正方形有 4 條一樣長的邊！",
		"周長計算"
	],
	[
		"ma-3-6",
		3,
		"upper",
		"geometry",
		"長 8 公分、寬 5 公分的長方形，周長是多少？",
		"長8寬5→周長",
		[
			"26",
			"40",
			"13",
			"24"
		],
		0,
		"周長 = (8 + 5) × 2 = 26 公分。",
		"周長是兩條長加兩條寬！",
		"長方形周長"
	],
	[
		"ma-3-7",
		3,
		"upper",
		"fraction",
		"3/8 + 4/8 = ?",
		"3/8 + 4/8",
		[
			"7/8",
			"7/16",
			"1/8",
			"8/8"
		],
		0,
		"同分母分數相加，分母不變，分子相加 3+4=7，得 7/8。",
		"分母保持 8，分子相加！",
		"同分母分數加法"
	],
	[
		"ma-3-8",
		3,
		"lower",
		"fraction",
		"1 - 3/7 = ?",
		"1 - 3/7",
		[
			"4/7",
			"3/7",
			"5/7",
			"2/7"
		],
		0,
		"把 1 寫成 7/7，7/7 - 3/7 = 4/7。",
		"1 等於 7/7 喔！",
		"分數減法"
	],
	[
		"ma-3-9",
		3,
		"lower",
		"calc",
		"2.6 + 1.8 = ?",
		"2.6 + 1.8",
		[
			"4.4",
			"3.4",
			"4.2",
			"3.14"
		],
		0,
		"十分位 0.6+0.8=1.4，加上 2+1=3，得 4.4。",
		"小數點對齊後相加！",
		"一位小數加法"
	],
	[
		"ma-3-10",
		3,
		"lower",
		"calc",
		"3 公尺 45 公分等於幾公分？",
		"3m 45cm = ?cm",
		[
			"345",
			"3045",
			"3450",
			"75"
		],
		0,
		"1 公尺 = 100 公分，3×100 + 45 = 345 公分。",
		"1 公尺是 100 公分！",
		"長度單位換算"
	],
	[
		"ma-3-11",
		3,
		"lower",
		"calc",
		"2 小時 15 分鐘共是幾分鐘？",
		"2時15分 = ?分",
		[
			"135",
			"125",
			"215",
			"75"
		],
		0,
		"1 小時 = 60 分，2×60 + 15 = 135 分鐘。",
		"2 小時是 120 分鐘！",
		"時間換算"
	],
	[
		"ma-3-12",
		3,
		"lower",
		"geometry",
		"半徑 6 公分的圓，直徑是多少公分？",
		"半徑6→直徑",
		[
			"12",
			"3",
			"18",
			"36"
		],
		0,
		"直徑 = 半徑 × 2 = 6 × 2 = 12 公分。",
		"直徑是半徑的 2 倍！",
		"圓的認識"
	],
	[
		"ma-3-13",
		3,
		"lower",
		"calc",
		"1 公斤 300 公克等於幾公克？",
		"1kg300g = ?g",
		[
			"1300",
			"1030",
			"400",
			"130"
		],
		0,
		"1 公斤 = 1000 公克，1000 + 300 = 1300 公克。",
		"1 公斤有 1000 公克。",
		"重量換算"
	],
	[
		"ma-3-14",
		3,
		"lower",
		"fraction",
		"一盒餅乾有 12 片，吃了 1/3 盒是吃幾片？",
		"12片的 1/3",
		[
			"4",
			"3",
			"6",
			"9"
		],
		0,
		"12 ÷ 3 = 4 片。",
		"把 12 平分成 3 份！",
		"分數的意義"
	],
	[
		"ma-4-1",
		4,
		"upper",
		"calc",
		"25 × 16 = ?",
		"25 × 16",
		[
			"400",
			"350",
			"420",
			"380"
		],
		0,
		"25 × 4 = 100，100 × 4 = 400。",
		"把 16 拆成 4 × 4 超好算！",
		"乘法巧算"
	],
	[
		"ma-4-2",
		4,
		"upper",
		"calc",
		"144 ÷ 12 = ?",
		"144 ÷ 12",
		[
			"12",
			"11",
			"14",
			"13"
		],
		0,
		"12 × 12 = 144，商為 12。",
		"想想 12 的平方！",
		"二位數除法"
	],
	[
		"ma-4-3",
		4,
		"upper",
		"geometry",
		"周長 24 公分的正方形，面積是多少平方公分？",
		"周長24正方形→面積",
		[
			"36",
			"24",
			"48",
			"16"
		],
		0,
		"邊長 = 24 ÷ 4 = 6，面積 = 6 × 6 = 36 平方公分。",
		"先除以 4 算出邊長！",
		"正方形面積"
	],
	[
		"ma-4-4",
		4,
		"upper",
		"geometry",
		"三角形三個內角和一定是幾度？",
		"三角形內角和",
		[
			"180°",
			"90°",
			"360°",
			"270°"
		],
		0,
		"任何平面三角形的三個內角和恆為 180°。",
		"等於一個平角喔！",
		"三角形內角和"
	],
	[
		"ma-4-5",
		4,
		"upper",
		"geometry",
		"等腰直角三角形中，兩個銳角各是幾度？",
		"等腰直角→銳角",
		[
			"45°",
			"60°",
			"30°",
			"90°"
		],
		0,
		"(180° - 90°) ÷ 2 = 45°。",
		"扣掉 90° 再平分！",
		"角度計算"
	],
	[
		"ma-4-6",
		4,
		"upper",
		"fraction",
		"把假分數 11/4 化成帶分數是多少？",
		"11/4 = ?(帶分數)",
		[
			"2又3/4",
			"2又1/4",
			"3又1/4",
			"1又3/4"
		],
		0,
		"11 ÷ 4 = 2 餘 3，故為 2 又 3/4。",
		"用 11 除以 4 看商和餘數！",
		"假分數與帶分數"
	],
	[
		"ma-4-7",
		4,
		"upper",
		"calc",
		"18 + 6 × 5 = ?",
		"18 + 6 × 5",
		[
			"48",
			"120",
			"38",
			"58"
		],
		0,
		"先乘除後加減：6×5=30，18+30=48。",
		"一定要先算乘法！",
		"四則運算規則"
	],
	[
		"ma-4-8",
		4,
		"lower",
		"calc",
		"(45 - 15) ÷ 5 = ?",
		"(45-15) ÷ 5",
		[
			"6",
			"42",
			"30",
			"8"
		],
		0,
		"先算括號內 45-15=30，再 30÷5=6。",
		"括號內優先計算！",
		"括號四則運算"
	],
	[
		"ma-4-9",
		4,
		"lower",
		"geometry",
		"長 12 公分、寬 7 公分的長方形面積是多少？",
		"長12寬7→面積",
		[
			"84",
			"38",
			"74",
			"96"
		],
		0,
		"長方形面積 = 長 × 寬 = 12 × 7 = 84 平方公分。",
		"長乘以寬就是面積！",
		"長方形面積"
	],
	[
		"ma-4-10",
		4,
		"lower",
		"fraction",
		"0.75 等於哪一個分數？",
		"0.75 = ?(分數)",
		[
			"3/4",
			"2/5",
			"7/5",
			"4/5"
		],
		0,
		"0.75 = 75/100，約分除以 25 得 3/4。",
		"想成 75/100 約分！",
		"小數轉分數"
	],
	[
		"ma-4-11",
		4,
		"lower",
		"calc",
		"5 公升 60 毫升等於幾毫升？",
		"5L 60mL = ?mL",
		[
			"5060",
			"560",
			"5600",
			"5006"
		],
		0,
		"1 公升 = 1000 毫升，5000 + 60 = 5060 毫升。",
		"別忘了百位要補 0！",
		"容量單位換算"
	],
	[
		"ma-4-12",
		4,
		"lower",
		"calc",
		"4.25 - 1.75 = ?",
		"4.25 - 1.75",
		[
			"2.5",
			"3.5",
			"2.25",
			"2.75"
		],
		0,
		"4.25 - 1.75 = 2.50 = 2.5。",
		"0.25 不夠減 0.75，向個位借 1！",
		"二位小數減法"
	],
	[
		"ma-4-13",
		4,
		"lower",
		"geometry",
		"平行四邊形相鄰兩角和是多少度？",
		"平行四邊形鄰角和",
		[
			"180°",
			"90°",
			"360°",
			"120°"
		],
		0,
		"兩組對邊平行，同側內角互補為 180°。",
		"四個角總和 360°，鄰角占一半！",
		"四邊形性質"
	],
	[
		"ma-4-14",
		4,
		"lower",
		"fraction",
		"3/4 + 1/2 = ?",
		"3/4 + 1/2",
		[
			"5/4",
			"4/6",
			"4/4",
			"7/4"
		],
		0,
		"通分 1/2 = 2/4，3/4 + 2/4 = 5/4。",
		"先把 1/2 通分成 2/4！",
		"異分母分數加法"
	],
	[
		"ma-5-1",
		5,
		"upper",
		"calc",
		"18 和 24 的最大公因數是多少？",
		"gcd(18, 24)",
		[
			"6",
			"3",
			"12",
			"8"
		],
		0,
		"18 的因數有 1,2,3,6,9,18；24 有 1,2,3,4,6,8,12,24，最大公因數是 6。",
		"找出兩數都能整除的最大數！",
		"最大公因數"
	],
	[
		"ma-5-2",
		5,
		"upper",
		"calc",
		"6 和 8 的最小公倍數是多少？",
		"lcm(6, 8)",
		[
			"24",
			"48",
			"12",
			"16"
		],
		0,
		"6 的倍數 6,12,18,24；8 的倍數 8,16,24，最小公倍數為 24。",
		"列出倍數找第一個重複的！",
		"最小公倍數"
	],
	[
		"ma-5-3",
		5,
		"upper",
		"fraction",
		"2/3 + 1/4 = ?",
		"2/3 + 1/4",
		[
			"11/12",
			"3/7",
			"9/12",
			"7/12"
		],
		0,
		"通分分母 12：8/12 + 3/12 = 11/12。",
		"3 和 4 的最小公倍數是 12！",
		"異分母加減"
	],
	[
		"ma-5-4",
		5,
		"upper",
		"fraction",
		"3/5 × 10/9 = ?",
		"3/5 × 10/9",
		[
			"2/3",
			"30/45",
			"1/3",
			"5/6"
		],
		0,
		"交叉約分：3與9約成1/3，10與5約成2/1，得 2/3。",
		"先交叉約分最快速！",
		"分數乘法"
	],
	[
		"ma-5-5",
		5,
		"upper",
		"geometry",
		"底 10 公分、高 6 公分的三角形，面積是多少？",
		"三角形底10高6→面積",
		[
			"30",
			"60",
			"16",
			"20"
		],
		0,
		"三角形面積 = 底 × 高 ÷ 2 = 10 × 6 ÷ 2 = 30。",
		"別忘了最後要除以 2！",
		"三角形面積"
	],
	[
		"ma-5-6",
		5,
		"upper",
		"geometry",
		"上底 4、下底 8、高 5 的梯形面積是多少？",
		"梯形(4+8)×5÷2",
		[
			"30",
			"60",
			"20",
			"35"
		],
		0,
		"梯形面積 = (4 + 8) × 5 ÷ 2 = 12 × 5 ÷ 2 = 30。",
		"(上底+下底)×高÷2！",
		"梯形面積"
	],
	[
		"ma-5-7",
		5,
		"upper",
		"calc",
		"2.4 × 0.5 = ?",
		"2.4 × 0.5",
		[
			"1.2",
			"12",
			"0.12",
			"2.9"
		],
		0,
		"乘以 0.5 相當於除以 2，2.4 ÷ 2 = 1.2。",
		"×0.5 就是取一半！",
		"小數乘法"
	],
	[
		"ma-5-8",
		5,
		"lower",
		"geometry",
		"長 5、寬 4、高 3 公分的長方體體積是多少？",
		"長5寬4高3→體積",
		[
			"60",
			"12",
			"47",
			"30"
		],
		0,
		"體積 = 長 × 寬 × 高 = 5 × 4 × 3 = 60 立方公分。",
		"三個邊長相乘！",
		"長方體體積"
	],
	[
		"ma-5-9",
		5,
		"lower",
		"geometry",
		"邊長 4 公分的正方體，表面積是多少平方公分？",
		"正方體邊4→表面積",
		[
			"96",
			"64",
			"16",
			"48"
		],
		0,
		"一面面積 4×4=16，共 6 個面，16 × 6 = 96。",
		"正方體有 6 個正方形面！",
		"正方體表面積"
	],
	[
		"ma-5-10",
		5,
		"lower",
		"calc",
		"一件 500 元的衣服打 8 折，售價是多少元？",
		"500元打8折",
		[
			"400",
			"420",
			"100",
			"450"
		],
		0,
		"打 8 折即乘以 0.8，500 × 0.8 = 400 元。",
		"8 折就是原價的 80%！",
		"百分率與折扣"
	],
	[
		"ma-5-11",
		5,
		"lower",
		"calc",
		"如果 3x + 5 = 20，則 x = ?",
		"3x + 5 = 20",
		[
			"5",
			"15",
			"3",
			"7"
		],
		0,
		"3x = 20 - 5 = 15，x = 15 ÷ 3 = 5。",
		"先把 +5 移到右邊變成 -5！",
		"未知數運算"
	],
	[
		"ma-5-12",
		5,
		"lower",
		"fraction",
		"5/6 - 1/3 = ?",
		"5/6 - 1/3",
		[
			"1/2",
			"4/3",
			"2/6",
			"1/3"
		],
		0,
		"1/3 = 2/6，5/6 - 2/6 = 3/6 = 1/2。",
		"約分後最簡分數是 1/2！",
		"分數減法與約分"
	],
	[
		"ma-5-13",
		5,
		"lower",
		"calc",
		"下列哪個數是質數？",
		"找出質數",
		[
			"29",
			"27",
			"21",
			"33"
		],
		0,
		"29 只有 1 和 29 兩個因數；27=3×9, 21=3×7, 33=3×11。",
		"檢查看看能不能被 3 整除！",
		"質數判斷"
	],
	[
		"ma-5-14",
		5,
		"lower",
		"calc",
		"1 立方公尺等於多少公升？",
		"1 m³ = ? 公升",
		[
			"1000",
			"100",
			"10",
			"10000"
		],
		0,
		"1 立方公尺 = 1000 立方公寸 = 1000 公升。",
		"等於 1 度水喔！",
		"容積與體積"
	],
	[
		"ma-6-1",
		6,
		"upper",
		"fraction",
		"3/4 ÷ 3/8 = ?",
		"3/4 ÷ 3/8",
		[
			"2",
			"9/32",
			"1/2",
			"4"
		],
		0,
		"除以分數等於乘以倒數：3/4 × 8/3 = 2。",
		"除號變乘號，後面分數倒過來！",
		"分數除法"
	],
	[
		"ma-6-2",
		6,
		"upper",
		"calc",
		"7.2 ÷ 0.9 = ?",
		"7.2 ÷ 0.9",
		[
			"8",
			"0.8",
			"80",
			"9"
		],
		0,
		"被除數與除數同乘 10 變成 72 ÷ 9 = 8。",
		"小數點同時向右移一位！",
		"小數除法"
	],
	[
		"ma-6-3",
		6,
		"upper",
		"calc",
		"若 3 : 5 = 12 : □，則 □ = ?",
		"3:5 = 12:□",
		[
			"20",
			"15",
			"18",
			"25"
		],
		0,
		"前項 3 乘以 4 得 12，後項 5 也乘以 4 得 20。",
		"前項變 4 倍，後項也要變 4 倍！",
		"比與比值"
	],
	[
		"ma-6-4",
		6,
		"upper",
		"geometry",
		"半徑 10 公分的圓，圓面積約是多少？（圓周率 3.14）",
		"r=10 圓面積",
		[
			"314",
			"62.8",
			"31.4",
			"157"
		],
		0,
		"圓面積 = 半徑 × 半徑 × 3.14 = 10 × 10 × 3.14 = 314。",
		"記得是半徑乘半徑再乘 3.14！",
		"圓面積"
	],
	[
		"ma-6-5",
		6,
		"upper",
		"geometry",
		"直徑 10 公分的圓，圓周長約是多少？（圓周率 3.14）",
		"d=10 圓周長",
		[
			"31.4",
			"314",
			"62.8",
			"15.7"
		],
		0,
		"圓周長 = 直徑 × 3.14 = 10 × 3.14 = 31.4。",
		"圓周長 = 直徑 × 3.14！",
		"圓周長"
	],
	[
		"ma-6-6",
		6,
		"upper",
		"calc",
		"把 36 做質因數分解，結果是？",
		"36 質因數分解",
		[
			"2×2×3×3",
			"4×9",
			"2×3×6",
			"2×2×2×3"
		],
		0,
		"36 = 4 × 9 = 2 × 2 × 3 × 3，所有因數都須是質數。",
		"確認每個乘數都是質數喔！",
		"質因數分解"
	],
	[
		"ma-6-7",
		6,
		"upper",
		"calc",
		"汽車 3 小時行駛 210 公里，平均時速是多少？",
		"210km ÷ 3hr",
		[
			"70公里/時",
			"60公里/時",
			"80公里/時",
			"630公里/時"
		],
		0,
		"速率 = 距離 ÷ 時間 = 210 ÷ 3 = 70 公里/時。",
		"距離除以時間就是速率！",
		"速率計算"
	],
	[
		"ma-6-8",
		6,
		"lower",
		"geometry",
		"底面積 25 平方公分、高 8 公分的圓柱體積是？",
		"圓柱體積 25×8",
		[
			"200",
			"100",
			"33",
			"400"
		],
		0,
		"柱體體積 = 底面積 × 高 = 25 × 8 = 200 立方公分。",
		"所有直柱體體積都是底面積×高！",
		"柱體體積"
	],
	[
		"ma-6-9",
		6,
		"lower",
		"calc",
		"母子問題：媽媽比小華大 28 歲，今年媽媽是小華的 5 倍，小華幾歲？",
		"差28歲且為5倍",
		[
			"7歲",
			"6歲",
			"8歲",
			"5歲"
		],
		0,
		"相差 5-1=4 倍對應 28 歲，1 倍 = 28 ÷ 4 = 7 歲。",
		"5 倍減 1 倍是 4 倍差！",
		"基準量與比較量"
	],
	[
		"ma-6-10",
		6,
		"lower",
		"calc",
		"雞兔同籠共 10 頭、28 隻腳，請問有幾隻兔子？",
		"10頭28腳→兔?",
		[
			"4隻",
			"6隻",
			"5隻",
			"3隻"
		],
		0,
		"假設全是雞有 20 隻腳，多出 8 隻腳，每換 1 隻兔多 2 腳，8÷2=4 隻兔。",
		"多出的腳除以 2 就是兔子數！",
		"雞兔同籠"
	],
	[
		"ma-6-11",
		6,
		"lower",
		"geometry",
		"比例尺 1 : 50000 的地圖上 2 公分，實際距離是幾公里？",
		"1:50000 2cm→km",
		[
			"1公里",
			"10公里",
			"0.5公里",
			"5公里"
		],
		0,
		"2 × 50000 = 100000 公分 = 1000 公尺 = 1 公里。",
		"1 公里 = 100000 公分！",
		"比例尺換算"
	],
	[
		"ma-6-12",
		6,
		"lower",
		"fraction",
		"一個披薩吃了 2/5 後，再吃剩下的 1/3，還剩多少？",
		"1 - 2/5 再吃1/3",
		[
			"2/5",
			"3/5",
			"4/15",
			"1/5"
		],
		0,
		"剩 3/5，再吃 3/5 × 1/3 = 1/5，最後剩 3/5 - 1/5 = 2/5。",
		"剩下的 3/5 的 1/3 是 1/5！",
		"分數應用題"
	],
	[
		"ma-6-13",
		6,
		"lower",
		"calc",
		"從 1 加到 20 的總和是多少？",
		"1+2+...+20",
		[
			"210",
			"200",
			"190",
			"220"
		],
		0,
		"高斯公式：(1 + 20) × 20 ÷ 2 = 210。",
		"(首項+末項)×項數÷2！",
		"等差數列求和"
	],
	[
		"ma-6-14",
		6,
		"lower",
		"geometry",
		"圓心角 90° 的扇形，面積占整個圓的幾分之幾？",
		"90°扇形占圓?",
		[
			"1/4",
			"1/3",
			"1/2",
			"1/6"
		],
		0,
		"90° ÷ 360° = 1/4。",
		"一整個圓是 360°！",
		"扇形面積比例"
	]
].map(([id, grade, semester, type, prompt, formulaShield, options, correctIndex, explanation, hint, knowledgeTag]) => ({
	id,
	grade,
	semester,
	subject: "math",
	type,
	prompt,
	answer: options[correctIndex],
	explanation,
	hint,
	knowledgeTag,
	payload: {
		formulaShield,
		options,
		correctIndex
	}
}));
var SCIENCE_QUESTIONS$1 = [
	{
		id: "sc-3-1",
		grade: 3,
		semester: "upper",
		dishName: "植物根莖燉鍋",
		orderRequirement: "挑選屬於植物「根」與「莖」的食材＋中火燉煮＋中性純水",
		ingredients: [
			{
				id: "carrot",
				name: "紅蘿蔔",
				categoryTag: "貯藏根",
				color: "#F97316",
				accent: "#FED7AA",
				isCorrect: true
			},
			{
				id: "potato",
				name: "馬鈴薯",
				categoryTag: "地下塊莖",
				color: "#D97706",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "cabbage",
				name: "高麗菜",
				categoryTag: "葉片",
				color: "#22C55E",
				accent: "#DCFCE7",
				isCorrect: false,
				wrongReason: "高麗菜食用部位主要是「葉」，不是根或莖喔！"
			},
			{
				id: "tomato",
				name: "番茄",
				categoryTag: "果實",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "番茄是植物的「果實」，裡面藏著種子！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "中火慢燉 (60°C)",
		targetPh: "neutral",
		targetPhLabel: "中性純水湯底",
		effectStyle: "nature",
		explanation: "紅蘿蔔是儲藏養分的根，馬鈴薯則是有芽眼的地下塊莖！",
		hint: "馬鈴薯長在土裡，但它其實是地下莖喔！",
		knowledgeTag: "植物的構造"
	},
	{
		id: "sc-3-2",
		grade: 3,
		semester: "upper",
		dishName: "磁力吸鐵拼盤",
		orderRequirement: "挑選「會被磁鐵吸引」的金屬食材＋急凍冷卻＋中性調味",
		ingredients: [
			{
				id: "iron",
				name: "鐵釘酥",
				categoryTag: "鐵製品",
				color: "#64748B",
				accent: "#E2E8F0",
				isCorrect: true
			},
			{
				id: "clip",
				name: "鋼迴紋針",
				categoryTag: "含鐵合金",
				color: "#94A3B8",
				accent: "#F1F5F9",
				isCorrect: true
			},
			{
				id: "copper",
				name: "銅幣餅",
				categoryTag: "銅金屬",
				color: "#B45309",
				accent: "#FDE68A",
				isCorrect: false,
				wrongReason: "純銅不會被一般磁鐵吸引喔！"
			},
			{
				id: "wood",
				name: "木頭塊",
				categoryTag: "非金屬",
				color: "#92400E",
				accent: "#FCD34D",
				isCorrect: false,
				wrongReason: "木頭是非金屬，不會受磁力吸引！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "急凍定型 (0°C)",
		targetPh: "neutral",
		targetPhLabel: "中性純水",
		effectStyle: "ice",
		explanation: "磁鐵能吸引鐵、鈷、鎳等磁性金屬，但不會吸引銅、鋁或木頭。",
		hint: "找出含「鐵」或「鋼」的選項！",
		knowledgeTag: "磁鐵的性質"
	},
	{
		id: "sc-3-3",
		grade: 3,
		semester: "upper",
		dishName: "急凍冰晶聖代",
		orderRequirement: "挑選「水液態變固態」所需原料＋0°C 急凍結冰＋中性純水",
		ingredients: [
			{
				id: "water",
				name: "山泉液態水",
				categoryTag: "液態水",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "saltice",
				name: "降溫冰鹽",
				categoryTag: "吸熱降溫",
				color: "#A5F3FC",
				accent: "#ECFEFF",
				isCorrect: true
			},
			{
				id: "sand",
				name: "乾燥細沙",
				categoryTag: "不溶固體",
				color: "#D6D3D1",
				accent: "#F5F5F4",
				isCorrect: false,
				wrongReason: "細沙不會溶解也無法結成冰晶！"
			},
			{
				id: "oil",
				name: "沙拉油",
				categoryTag: "油類",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: false,
				wrongReason: "油水不相溶，不是製冰主角！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "凝固結冰 (0°C)",
		targetPh: "neutral",
		targetPhLabel: "中性純水",
		effectStyle: "ice",
		explanation: "純水在 0°C 時會由液態凝固成固態的冰，加鹽可讓冰水溫度降到 0°C 以下。",
		hint: "水結冰的溫度是 0°C 藍區！",
		knowledgeTag: "水的三態變化"
	},
	{
		id: "sc-3-4",
		grade: 3,
		semester: "lower",
		dishName: "沸騰雲霧拉麵",
		orderRequirement: "挑選「能完全溶解於水」的調味料＋100°C 沸騰汽化＋中性高湯",
		ingredients: [
			{
				id: "salt",
				name: "海鹽結晶",
				categoryTag: "可溶解",
				color: "#F8FAFC",
				accent: "#CBD5E1",
				isCorrect: true
			},
			{
				id: "sugar",
				name: "特級砂糖",
				categoryTag: "可溶解",
				color: "#FEF3C7",
				accent: "#FDE68A",
				isCorrect: true
			},
			{
				id: "starch",
				name: "太白粉沙",
				categoryTag: "難溶解沉澱",
				color: "#E2E8F0",
				accent: "#94A3B8",
				isCorrect: false,
				wrongReason: "太白粉在冷水中容易沉澱，不是完全真溶液！"
			},
			{
				id: "pepper",
				name: "黑胡椒粒",
				categoryTag: "不可溶解",
				color: "#334155",
				accent: "#64748B",
				isCorrect: false,
				wrongReason: "黑胡椒粒會浮沉在水中，無法溶解！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "沸騰汽化 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清水",
		effectStyle: "fire",
		explanation: "食鹽與砂糖能均勻分散溶解於水中，而水在 100°C 會劇烈沸騰變水蒸氣。",
		hint: "想想哪些調味料放進水裡攪拌會「消失變透明」！",
		knowledgeTag: "物質的溶解"
	},
	{
		id: "sc-3-5",
		grade: 3,
		semester: "lower",
		dishName: "昆蟲六足便當",
		orderRequirement: "挑選「真正屬於昆蟲」的造型飯糰（六隻腳、分頭胸腹）＋中火加熱",
		ingredients: [
			{
				id: "beetle",
				name: "獨角仙飯糰",
				categoryTag: "6隻腳昆蟲",
				color: "#78350F",
				accent: "#FDE68A",
				isCorrect: true
			},
			{
				id: "butterfly",
				name: "鳳蝶壽司",
				categoryTag: "6隻腳昆蟲",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "spider",
				name: "蜘蛛餅乾",
				categoryTag: "8隻腳蛛形綱",
				color: "#475569",
				accent: "#CBD5E1",
				isCorrect: false,
				wrongReason: "蜘蛛有 8 隻腳，不是昆蟲喔！"
			},
			{
				id: "centipede",
				name: "蜈蚣捲",
				categoryTag: "多足綱",
				color: "#DC2626",
				accent: "#FECACA",
				isCorrect: false,
				wrongReason: "蜈蚣有很多隻腳，不屬於昆蟲！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "溫暖中火 (55°C)",
		targetPh: "neutral",
		targetPhLabel: "中性醬汁",
		effectStyle: "nature",
		explanation: "昆蟲的身體分為頭、胸、腹三部分，且胸部有 3 對（6 隻）腳；蜘蛛有 8 隻腳不是昆蟲。",
		hint: "昆蟲一定只有 6 隻腳！",
		knowledgeTag: "認識昆蟲"
	},
	{
		id: "sc-3-6",
		grade: 3,
		semester: "upper",
		dishName: "種子發芽沙拉",
		orderRequirement: "挑選「種子發芽必備條件」元素＋適溫中火＋中性純水",
		ingredients: [
			{
				id: "moisture",
				name: "清涼水滴",
				categoryTag: "水分",
				color: "#0EA5E9",
				accent: "#BAE6FD",
				isCorrect: true
			},
			{
				id: "air",
				name: "新鮮空氣泡",
				categoryTag: "空氣",
				color: "#93C5FD",
				accent: "#EFF6FF",
				isCorrect: true
			},
			{
				id: "rock",
				name: "純碎石頭",
				categoryTag: "非必要",
				color: "#78716C",
				accent: "#E7E5E4",
				isCorrect: false,
				wrongReason: "沒有石頭或土壤，在濕棉花上種子也能發芽喔！"
			},
			{
				id: "fertilizer",
				name: "濃縮化肥",
				categoryTag: "過量傷芽",
				color: "#A855F7",
				accent: "#F3E8FF",
				isCorrect: false,
				wrongReason: "種子本身有子葉提供養分，發芽初期不需濃化肥！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "適宜室溫 (25°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清水",
		effectStyle: "nature",
		explanation: "種子發芽需要適當的水分、空氣與適宜的溫度。",
		hint: "在濕衛生紙上種綠豆需要哪兩樣東西？",
		knowledgeTag: "種菜與發芽"
	},
	{
		id: "sc-3-7",
		grade: 3,
		semester: "lower",
		dishName: "葉脈拼貼果凍",
		orderRequirement: "挑選具有「平行脈」的植物葉片＋急凍成型＋中性果凍液",
		ingredients: [
			{
				id: "corn",
				name: "玉米葉",
				categoryTag: "平行脈",
				color: "#84CC16",
				accent: "#ECFCCB",
				isCorrect: true
			},
			{
				id: "bamboo",
				name: "竹子葉",
				categoryTag: "平行脈",
				color: "#16A34A",
				accent: "#DCFCE7",
				isCorrect: true
			},
			{
				id: "maple",
				name: "楓樹葉",
				categoryTag: "網狀脈",
				color: "#EA580C",
				accent: "#FFEDD5",
				isCorrect: false,
				wrongReason: "楓葉是交錯的網狀脈喔！"
			},
			{
				id: "hibiscus",
				name: "朱槿葉",
				categoryTag: "網狀脈",
				color: "#15803D",
				accent: "#BBF7D0",
				isCorrect: false,
				wrongReason: "朱槿葉屬於網狀脈！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "冷藏凝固 (5°C)",
		targetPh: "neutral",
		targetPhLabel: "中性原味",
		effectStyle: "nature",
		explanation: "單子葉植物如竹子、玉米、水稻，葉脈多呈現平行的平行脈。",
		hint: "長條細長的葉子常是平行脈！",
		knowledgeTag: "葉脈觀察"
	},
	{
		id: "sc-3-8",
		grade: 3,
		semester: "upper",
		dishName: "空氣力量舒芙蕾",
		orderRequirement: "挑選「利用空氣佔空間與壓縮」的膨鬆食材＋中火烘烤",
		ingredients: [
			{
				id: "whip",
				name: "打發蛋白泡",
				categoryTag: "包覆空氣",
				color: "#FFFBEB",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "yeast",
				name: "發酵氣體包",
				categoryTag: "產生氣體",
				color: "#FDE68A",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "brick",
				name: "實心黑糖磚",
				categoryTag: "無空隙",
				color: "#78350F",
				accent: "#D97706",
				isCorrect: false,
				wrongReason: "實心黑糖磚沒有空氣孔隙，無法蓬鬆！"
			},
			{
				id: "marble",
				name: "玻璃彈珠",
				categoryTag: "不可食固體",
				color: "#06B6D4",
				accent: "#CFFAFE",
				isCorrect: false,
				wrongReason: "彈珠不能吃也沒有空氣彈力喔！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "烘焙中火 (65°C)",
		targetPh: "neutral",
		targetPhLabel: "中性原味",
		effectStyle: "fire",
		explanation: "空氣看不見但確實佔有空間，受熱膨脹會讓甜點變得蓬鬆鬆軟！",
		hint: "找出把空氣鎖在裡面的材料！",
		knowledgeTag: "空氣的性質"
	},
	{
		id: "sc-3-9",
		grade: 3,
		semester: "lower",
		dishName: "毛細現象彩虹捲",
		orderRequirement: "挑選「具有細小縫隙可產生毛細現象」的吸汁材料＋中溫定型",
		ingredients: [
			{
				id: "towel",
				name: "棉質濾布",
				categoryTag: "纖維細縫",
				color: "#F472B6",
				accent: "#FCE7F3",
				isCorrect: true
			},
			{
				id: "paper",
				name: "吸水宣紙",
				categoryTag: "紙纖維細縫",
				color: "#FEF08A",
				accent: "#FEFCE8",
				isCorrect: true
			},
			{
				id: "plastic",
				name: "塑膠薄膜",
				categoryTag: "無孔隙防水",
				color: "#94A3B8",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "塑膠膜沒有細縫，水無法產生毛細現象！"
			},
			{
				id: "foil",
				name: "鋁箔紙",
				categoryTag: "金屬不吸水",
				color: "#CBD5E1",
				accent: "#F8FAFC",
				isCorrect: false,
				wrongReason: "鋁箔紙不具吸水細縫喔！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "溫熱上色 (50°C)",
		targetPh: "neutral",
		targetPhLabel: "中性色素水",
		effectStyle: "rainbow",
		explanation: "水會沿著物體細小的縫隙向上或向四周移動，這就是毛細現象。",
		hint: "選出能把水「吸起來」的材料！",
		knowledgeTag: "毛細現象"
	},
	{
		id: "sc-3-10",
		grade: 3,
		semester: "upper",
		dishName: "風力旋轉派",
		orderRequirement: "挑選「風力可推動」的輕盈材料＋中火烘焙＋中性原味",
		ingredients: [
			{
				id: "feather",
				name: "糖絲羽毛",
				categoryTag: "輕盈受風",
				color: "#FBCFE8",
				accent: "#FDF2F8",
				isCorrect: true
			},
			{
				id: "pinwheel",
				name: "餅乾風車葉",
				categoryTag: "扇葉受力",
				color: "#FBBF24",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "anvil",
				name: "鑄鐵塊",
				categoryTag: "過重難動",
				color: "#334155",
				accent: "#64748B",
				isCorrect: false,
				wrongReason: "鐵塊太重，微風無法推動它！"
			},
			{
				id: "stone",
				name: "鵝卵石",
				categoryTag: "無受風翼",
				color: "#78716C",
				accent: "#D6D3D1",
				isCorrect: false,
				wrongReason: "石頭既重又無扇葉，不適合做風車！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "烘焙中火 (60°C)",
		targetPh: "neutral",
		targetPhLabel: "中性糖漿",
		effectStyle: "nature",
		explanation: "流動的空氣形成風，風力大小與受風面積及物體重量有關。",
		hint: "選出能靠風轉動或飄動的材料！",
		knowledgeTag: "風與空氣流動"
	},
	{
		id: "sc-3-11",
		grade: 3,
		semester: "lower",
		dishName: "蔬果果實百匯",
		orderRequirement: "挑選屬於植物「果實」的美味食材＋冰涼保鮮＋酸性檸檬汁",
		ingredients: [
			{
				id: "apple",
				name: "紅蘋果",
				categoryTag: "果實",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: true
			},
			{
				id: "cucumber",
				name: "小黃瓜",
				categoryTag: "果實",
				color: "#22C55E",
				accent: "#DCFCE7",
				isCorrect: true
			},
			{
				id: "spinach",
				name: "菠菜",
				categoryTag: "葉菜",
				color: "#15803D",
				accent: "#BBF7D0",
				isCorrect: false,
				wrongReason: "菠菜吃的是葉片，不是果實！"
			},
			{
				id: "sweetpotato",
				name: "地瓜",
				categoryTag: "塊根",
				color: "#D97706",
				accent: "#FDE68A",
				isCorrect: false,
				wrongReason: "地瓜是膨大的「塊根」喔！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "冰鎮保鮮 (4°C)",
		targetPh: "acid",
		targetPhLabel: "酸性檸檬汁防褐變",
		effectStyle: "rainbow",
		explanation: "裡面有種子的蘋果、小黃瓜都是果實；檸檬酸可減緩蘋果切面氧化變色！",
		hint: "切開裡面有種子的就是果實！",
		knowledgeTag: "果實與種子"
	},
	{
		id: "sc-3-12",
		grade: 3,
		semester: "lower",
		dishName: "晴雨氣溫冷湯",
		orderRequirement: "挑選正確「測量氣溫」的條件食材＋冰涼低溫＋中性高湯",
		ingredients: [
			{
				id: "shade",
				name: "陰涼通風冰",
				categoryTag: "正確測溫點",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "thermo",
				name: "標準溫度計",
				categoryTag: "測溫儀器",
				color: "#F43F5E",
				accent: "#FFE4E6",
				isCorrect: true
			},
			{
				id: "directsun",
				name: "烈日直曬石",
				categoryTag: "測溫會偏高",
				color: "#F97316",
				accent: "#FFEDD5",
				isCorrect: false,
				wrongReason: "陽光直射會讓溫度計讀數偏高，不準確喔！"
			},
			{
				id: "handheat",
				name: "手握液囊",
				categoryTag: "體溫干擾",
				color: "#EC4899",
				accent: "#FCE7F3",
				isCorrect: false,
				wrongReason: "手握液囊會測到體溫而非氣溫！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "涼爽低溫 (10°C)",
		targetPh: "neutral",
		targetPhLabel: "中性冷高湯",
		effectStyle: "ice",
		explanation: "測量氣溫應在陰涼、通風且離地約 1.2~1.5 公尺處，避免陽光直射與手觸液囊。",
		hint: "百葉箱裡是陰涼通風的！",
		knowledgeTag: "氣溫觀測"
	},
	{
		id: "sc-3-13",
		grade: 3,
		semester: "upper",
		dishName: "花瓣授粉蜜茶",
		orderRequirement: "挑選吸引昆蟲幫忙「授粉」的花部特徵＋100°C 熱水沖泡",
		ingredients: [
			{
				id: "nectar",
				name: "香甜花蜜",
				categoryTag: "吸引昆蟲",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "petal",
				name: "鮮豔花瓣",
				categoryTag: "視覺吸引",
				color: "#EC4899",
				accent: "#FCE7F3",
				isCorrect: true
			},
			{
				id: "root",
				name: "地下根毛",
				categoryTag: "吸收水分",
				color: "#A16207",
				accent: "#FEF08A",
				isCorrect: false,
				wrongReason: "根毛埋在土裡吸水，不負責吸引昆蟲！"
			},
			{
				id: "bark",
				name: "粗糙樹皮",
				categoryTag: "保護樹幹",
				color: "#78350F",
				accent: "#D6D3D1",
				isCorrect: false,
				wrongReason: "樹皮用來保護植物莖幹喔！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "滾水沖茶 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性花茶湯",
		effectStyle: "rainbow",
		explanation: "蟲媒花通常擁有鮮豔花瓣與香甜花蜜，吸引蜜蜂蝴蝶前來傳遞花粉。",
		hint: "想想蜜蜂最喜歡花的哪兩個部分？",
		knowledgeTag: "花的構造與授粉"
	},
	{
		id: "sc-4-1",
		grade: 4,
		semester: "upper",
		dishName: "酸鹼彩虹變色湯",
		orderRequirement: "挑選讓「紫色高麗菜汁變紅」的酸性食材＋100°C 滾沸＋酸性檸檬試管",
		ingredients: [
			{
				id: "lemon",
				name: "新鮮檸檬",
				categoryTag: "酸性",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "vinegar",
				name: "蘋果果醋",
				categoryTag: "酸性",
				color: "#FB923C",
				accent: "#FFEDD5",
				isCorrect: true
			},
			{
				id: "baking",
				name: "小蘇打粉",
				categoryTag: "鹼性",
				color: "#E2E8F0",
				accent: "#F8FAFC",
				isCorrect: false,
				wrongReason: "小蘇打是鹼性，會讓紫高麗菜汁變藍綠色喔！"
			},
			{
				id: "soap",
				name: "肥皂泡",
				categoryTag: "鹼性",
				color: "#60A5FA",
				accent: "#DBEAFE",
				isCorrect: false,
				wrongReason: "肥皂水屬於鹼性，且不可食用！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "滾沸顯色 (100°C)",
		targetPh: "acid",
		targetPhLabel: "酸性試劑（變紅）",
		effectStyle: "rainbow",
		explanation: "紫色高麗菜汁是天然酸鹼指示劑，遇酸變紅/粉紅，遇鹼變藍綠！",
		hint: "檸檬與醋都是酸性的，滴入紫高麗菜汁會變紅！",
		knowledgeTag: "水溶液酸鹼性"
	},
	{
		id: "sc-4-2",
		grade: 4,
		semester: "upper",
		dishName: "藍綠魔法蘇打鍋",
		orderRequirement: "挑選「鹼性」清潔／烘焙原料讓紫高麗菜汁變藍綠＋中火調勻＋鹼性蘇打",
		ingredients: [
			{
				id: "soda",
				name: "食用小蘇打",
				categoryTag: "弱鹼性",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "limewater",
				name: "澄清石灰水",
				categoryTag: "鹼性",
				color: "#94A3B8",
				accent: "#F1F5F9",
				isCorrect: true
			},
			{
				id: "orange",
				name: "柳橙汁",
				categoryTag: "酸性",
				color: "#F97316",
				accent: "#FFEDD5",
				isCorrect: false,
				wrongReason: "柳橙汁含有檸檬酸，屬於酸性！"
			},
			{
				id: "sugarwater",
				name: "砂糖水",
				categoryTag: "中性",
				color: "#FEF08A",
				accent: "#FEFCE8",
				isCorrect: false,
				wrongReason: "糖水是中性，不會讓指示劑變色！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "溫和攪拌 (55°C)",
		targetPh: "alkali",
		targetPhLabel: "鹼性試劑（變藍綠）",
		effectStyle: "rainbow",
		explanation: "小蘇打水、石灰水屬於鹼性溶液，能使紅色石蕊試紙變藍、紫甘藍汁變藍綠。",
		hint: "鹼性溶液會讓紫甘藍汁變成藍綠色！",
		knowledgeTag: "鹼性水溶液"
	},
	{
		id: "sc-4-3",
		grade: 4,
		semester: "upper",
		dishName: "閃電導電鐵板燒",
		orderRequirement: "挑選「容易導電的導體」放上鐵板＋100°C 高溫炙燒＋中性調味",
		ingredients: [
			{
				id: "copperwire",
				name: "銅線捲",
				categoryTag: "優良導體",
				color: "#D97706",
				accent: "#FDE68A",
				isCorrect: true
			},
			{
				id: "aluminum",
				name: "鋁箔片",
				categoryTag: "金屬導體",
				color: "#94A3B8",
				accent: "#F8FAFC",
				isCorrect: true
			},
			{
				id: "rubber",
				name: "橡皮擦塊",
				categoryTag: "絕緣體",
				color: "#F472B6",
				accent: "#FCE7F3",
				isCorrect: false,
				wrongReason: "橡膠是絕緣體，不能導電喔！"
			},
			{
				id: "plasticstraw",
				name: "塑膠吸管",
				categoryTag: "絕緣體",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: false,
				wrongReason: "塑膠屬於絕緣體，無法形成通路！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "高溫炙燒 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性鹽水",
		effectStyle: "fire",
		explanation: "銅、鋁、鐵等金屬是良好導體；橡膠、塑膠與乾燥木材屬於絕緣體。",
		hint: "大部分金屬都能讓電流通過！",
		knowledgeTag: "導體與絕緣體"
	},
	{
		id: "sc-4-4",
		grade: 4,
		semester: "lower",
		dishName: "光線折射冰晶露",
		orderRequirement: "挑選會產生「光的折射與色散」的透明道具＋急凍低溫＋中性純水",
		ingredients: [
			{
				id: "prism",
				name: "三稜鏡冰塊",
				categoryTag: "色散折射",
				color: "#67E8F9",
				accent: "#ECFEFF",
				isCorrect: true
			},
			{
				id: "droplet",
				name: "清澈水珠",
				categoryTag: "折射彩虹",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "cardboard",
				name: "厚瓦楞紙",
				categoryTag: "不透光阻擋",
				color: "#A16207",
				accent: "#FEF3C7",
				isCorrect: false,
				wrongReason: "不透光的厚紙只會產生影子，無法折射！"
			},
			{
				id: "charcoal",
				name: "黑木炭",
				categoryTag: "吸收光線",
				color: "#1E293B",
				accent: "#475569",
				isCorrect: false,
				wrongReason: "黑木炭吸收大部分光線，無法透光折射！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "冰晶低溫 (0°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清水",
		effectStyle: "rainbow",
		explanation: "白光通過三稜鏡或水珠時，不同色光折射角度不同，會色散成紅橙黃綠藍靛紫！",
		hint: "選透明能讓光線穿過並彎折的物品！",
		knowledgeTag: "光的折射與色散"
	},
	{
		id: "sc-4-5",
		grade: 4,
		semester: "lower",
		dishName: "水域植物漂浮湯",
		orderRequirement: "挑選「漂浮性水生植物」食材＋中火保溫＋中性池水",
		ingredients: [
			{
				id: "hyacinth",
				name: "布袋蓮",
				categoryTag: "膨大葉柄漂浮",
				color: "#8B5CF6",
				accent: "#EDE9FE",
				isCorrect: true
			},
			{
				id: "duckweed",
				name: "青萍浮萍",
				categoryTag: "漂浮水面",
				color: "#22C55E",
				accent: "#DCFCE7",
				isCorrect: true
			},
			{
				id: "lotus",
				name: "荷花蓮藕",
				categoryTag: "挺水植根泥中",
				color: "#F472B6",
				accent: "#FCE7F3",
				isCorrect: false,
				wrongReason: "荷花根扎在池底泥土裡，屬於挺水性水生植物！"
			},
			{
				id: "elodea",
				name: "水蘊草",
				categoryTag: "沉水性植物",
				color: "#15803D",
				accent: "#BBF7D0",
				isCorrect: false,
				wrongReason: "水蘊草整株沉在水中，是沉水性植物！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "溫暖池水 (45°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清水",
		effectStyle: "nature",
		explanation: "布袋蓮葉柄膨大充滿氣室，與浮萍皆可隨水流漂浮於水面。",
		hint: "想想哪兩種植物的根不抓土、直接飄在水面？",
		knowledgeTag: "水生植物分類"
	},
	{
		id: "sc-4-6",
		grade: 4,
		semester: "upper",
		dishName: "昆蟲完全變態鬆餅",
		orderRequirement: "挑選會經歷「卵→幼蟲→蛹→成蟲」完全變態的昆蟲造型＋中火慢煎",
		ingredients: [
			{
				id: "silkworm",
				name: "蠶寶寶",
				categoryTag: "完全變態(有蛹)",
				color: "#F8FAFC",
				accent: "#E2E8F0",
				isCorrect: true
			},
			{
				id: "ladybug",
				name: "瓢蟲",
				categoryTag: "完全變態(有蛹)",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: true
			},
			{
				id: "grasshopper",
				name: "蝗蟲",
				categoryTag: "不完全變態",
				color: "#65A30D",
				accent: "#ECFCCB",
				isCorrect: false,
				wrongReason: "蝗蟲沒有「蛹」的階段，屬於不完全變態！"
			},
			{
				id: "dragonfly",
				name: "蜻蜓",
				categoryTag: "不完全變態",
				color: "#06B6D4",
				accent: "#CFFAFE",
				isCorrect: false,
				wrongReason: "蜻蜓稚蟲（水蠆）直接羽化，沒有蛹期！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "中火慢煎 (65°C)",
		targetPh: "neutral",
		targetPhLabel: "中性蜂蜜",
		effectStyle: "nature",
		explanation: "蝴蝶、蠶蛾、瓢蟲、獨角仙都有「蛹」期，屬於完全變態。",
		hint: "找會結繭或變成「蛹」的昆蟲！",
		knowledgeTag: "昆蟲的成長變態"
	},
	{
		id: "sc-4-7",
		grade: 4,
		semester: "lower",
		dishName: "月亮盈虧月餅",
		orderRequirement: "挑選正確的「月相變化」知識配料＋中火烘烤＋中性糖漿",
		ingredients: [
			{
				id: "fullmoon",
				name: "農曆十五滿月",
				categoryTag: "望月",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "crescent",
				name: "農曆初七上弦",
				categoryTag: "右亮半圓",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "selflight",
				name: "月亮自行發光",
				categoryTag: "錯誤觀念",
				color: "#64748B",
				accent: "#CBD5E1",
				isCorrect: false,
				wrongReason: "月亮本身不會發光，而是反射太陽光喔！"
			},
			{
				id: "daily",
				name: "每天形狀相同",
				categoryTag: "錯誤觀念",
				color: "#475569",
				accent: "#94A3B8",
				isCorrect: false,
				wrongReason: "月相約以 29.5 天為週期規律盈虧變化！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "烘焙中火 (60°C)",
		targetPh: "neutral",
		targetPhLabel: "中性桂花蜜",
		effectStyle: "rainbow",
		explanation: "月球反射太陽光，依農曆日期呈現朔→上弦→滿月(十五)→下弦的週期變化。",
		hint: "農曆十五月亮最圓喔！",
		knowledgeTag: "月亮與月相"
	},
	{
		id: "sc-4-8",
		grade: 4,
		semester: "upper",
		dishName: "串聯亮晶晶泡芙",
		orderRequirement: "挑選讓「燈泡變得更亮」的電路材料＋100°C 高溫烘烤",
		ingredients: [
			{
				id: "seriesbat",
				name: "電池串聯組",
				categoryTag: "電壓相加更亮",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "closedloop",
				name: "完整閉合導線",
				categoryTag: "形成通路",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: true
			},
			{
				id: "brokenwire",
				name: "斷路開關",
				categoryTag: "無法通電",
				color: "#64748B",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "斷路時電流無法流通，燈泡不會亮！"
			},
			{
				id: "reversebat",
				name: "正對正接反",
				categoryTag: "電壓抵消",
				color: "#475569",
				accent: "#CBD5E1",
				isCorrect: false,
				wrongReason: "電池正極接正極會抵消，燈泡無法正常發亮！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "高溫激發 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性奶油",
		effectStyle: "fire",
		explanation: "電池正負極依序串聯可提高電壓讓燈泡更亮，且必須構成封閉通路。",
		hint: "電池串聯（正接負）亮度會增加！",
		knowledgeTag: "電路串聯與並聯"
	},
	{
		id: "sc-4-9",
		grade: 4,
		semester: "lower",
		dishName: "彈力橡皮筋麵",
		orderRequirement: "挑選「具有彈性可儲存彈力位能」的材料＋中火快炒",
		ingredients: [
			{
				id: "rubberband",
				name: "橡皮筋麵條",
				categoryTag: "彈性材料",
				color: "#F97316",
				accent: "#FFEDD5",
				isCorrect: true
			},
			{
				id: "spring",
				name: "螺旋彈簧捲",
				categoryTag: "彈性金屬",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "clay",
				name: "油黏土塊",
				categoryTag: "塑性無彈回",
				color: "#A855F7",
				accent: "#F3E8FF",
				isCorrect: false,
				wrongReason: "黏土壓扁後不會自動彈回原狀，缺乏彈性！"
			},
			{
				id: "chalk",
				name: "粉筆段",
				categoryTag: "脆性易斷",
				color: "#F8FAFC",
				accent: "#CBD5E1",
				isCorrect: false,
				wrongReason: "粉筆受力容易折斷，沒有彈性！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "彈牙中火 (60°C)",
		targetPh: "neutral",
		targetPhLabel: "中性高湯",
		effectStyle: "fire",
		explanation: "橡皮筋與彈簧受力變形後能恢復原狀並釋放彈力，推動玩具車前進。",
		hint: "想想哪兩種東西拉長放手會彈回去！",
		knowledgeTag: "力與彈力"
	},
	{
		id: "sc-4-10",
		grade: 4,
		semester: "lower",
		dishName: "綠能太陽能熱湯",
		orderRequirement: "挑選「再生能源」料理動力＋100°C 沸騰加熱＋中性清湯",
		ingredients: [
			{
				id: "solar",
				name: "太陽能光板",
				categoryTag: "再生能源",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "wind",
				name: "風力渦輪葉",
				categoryTag: "再生能源",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "coal",
				name: "黑煤炭塊",
				categoryTag: "非再生化石燃料",
				color: "#1E293B",
				accent: "#64748B",
				isCorrect: false,
				wrongReason: "煤炭屬於不可再生的化石燃料，燃燒會排放二氧化碳！"
			},
			{
				id: "oilfuel",
				name: "重油燃料",
				categoryTag: "非再生能源",
				color: "#451A03",
				accent: "#92400E",
				isCorrect: false,
				wrongReason: "石油是有限的非再生能源喔！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "聚熱沸騰 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清湯",
		effectStyle: "fire",
		explanation: "太陽能、風力、水力可循環補充屬於再生能源；煤與石油是非再生能源。",
		hint: "選出大自然源源不絕的乾淨能源！",
		knowledgeTag: "能源與環保"
	},
	{
		id: "sc-4-11",
		grade: 4,
		semester: "upper",
		dishName: "虹吸瀑布特調",
		orderRequirement: "挑選成功發動「虹吸現象」的關鍵要素＋冰鎮清涼＋中性純水",
		ingredients: [
			{
				id: "fulltube",
				name: "裝滿水軟管",
				categoryTag: "管內無空氣",
				color: "#0EA5E9",
				accent: "#BAE6FD",
				isCorrect: true
			},
			{
				id: "heightdiff",
				name: "高低水位差",
				categoryTag: "出水口較低",
				color: "#3B82F6",
				accent: "#DBEAFE",
				isCorrect: true
			},
			{
				id: "airbubble",
				name: "空心乾燥管",
				categoryTag: "充滿空氣失敗",
				color: "#94A3B8",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "管內沒裝滿水就無法啟動虹吸現象！"
			},
			{
				id: "higherout",
				name: "出水口高於水面",
				categoryTag: "無法流出",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "出水口必須低於原本水位，水才會自動流出！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "冰涼低溫 (5°C)",
		targetPh: "neutral",
		targetPhLabel: "中性山泉水",
		effectStyle: "ice",
		explanation: "虹吸現象需要兩個條件：軟管內裝滿水（排除空氣），且出水口低於進水端水面。",
		hint: "管子要先裝滿水，且出口要放比較低！",
		knowledgeTag: "虹吸現象"
	},
	{
		id: "sc-4-12",
		grade: 4,
		semester: "upper",
		dishName: "酸鹼中和黃金湯",
		orderRequirement: "挑選中和胃酸／過酸湯底的「鹼性＋酸性」平衡組合＋中火調勻＋中性目標",
		ingredients: [
			{
				id: "citric",
				name: "微酸柑橘滴",
				categoryTag: "酸性",
				color: "#F97316",
				accent: "#FFEDD5",
				isCorrect: true
			},
			{
				id: "alkalisoda",
				name: "微鹼蘇打水",
				categoryTag: "鹼性中和",
				color: "#2DD4BF",
				accent: "#CCFBF1",
				isCorrect: true
			},
			{
				id: "sandstone",
				name: "不溶砂礫",
				categoryTag: "無法反應",
				color: "#78716C",
				accent: "#E7E5E4",
				isCorrect: false,
				wrongReason: "砂礫不溶於水，無法參與酸鹼中和！"
			},
			{
				id: "plasticbead",
				name: "塑膠珠",
				categoryTag: "惰性無反應",
				color: "#A855F7",
				accent: "#F3E8FF",
				isCorrect: false,
				wrongReason: "塑膠珠不會產生化學酸鹼反應！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "溫和中和 (50°C)",
		targetPh: "neutral",
		targetPhLabel: "調和至中性",
		effectStyle: "rainbow",
		explanation: "酸性溶液與鹼性溶液適當混合可發生酸鹼中和，趨近中性。",
		hint: "需要一酸一鹼互相平衡！",
		knowledgeTag: "酸鹼中和概念"
	},
	{
		id: "sc-4-13",
		grade: 4,
		semester: "lower",
		dishName: "聲音振動共鳴盅",
		orderRequirement: "挑選讓「聲音發聲與放大」的關鍵元件＋100°C 熱氣滾動",
		ingredients: [
			{
				id: "string",
				name: "繃緊琴弦",
				categoryTag: "振動發聲",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "soundbox",
				name: "空心共鳴箱",
				categoryTag: "放大音量",
				color: "#B45309",
				accent: "#FDE68A",
				isCorrect: true
			},
			{
				id: "vacuum",
				name: "真空玻璃球",
				categoryTag: "聲音無法傳播",
				color: "#334155",
				accent: "#94A3B8",
				isCorrect: false,
				wrongReason: "聲音需要介質傳播，真空中聽不到聲音！"
			},
			{
				id: "stillblock",
				name: "靜止棉塊",
				categoryTag: "吸音不振動",
				color: "#CBD5E1",
				accent: "#F8FAFC",
				isCorrect: false,
				wrongReason: "不振動的物體無法發出聲音！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "熱烈共振 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性高湯",
		effectStyle: "fire",
		explanation: "聲音由物體振動產生，並透過空氣等介質傳播，共鳴箱能讓音量變大。",
		hint: "發聲需要振動，放大需要共鳴箱！",
		knowledgeTag: "聲音的產生與傳播"
	},
	{
		id: "sc-5-1",
		grade: 5,
		semester: "upper",
		dishName: "氧氣助燃爆炎鍋",
		orderRequirement: "挑選「燃燒三要素」中的助燃氣體與可燃物＋100°C 高溫點燃",
		ingredients: [
			{
				id: "oxygen",
				name: "純淨氧氣泡",
				categoryTag: "助燃氣體",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "charcoalburn",
				name: "乾燥木柴",
				categoryTag: "可燃物",
				color: "#92400E",
				accent: "#FDE68A",
				isCorrect: true
			},
			{
				id: "co2",
				name: "二氧化碳",
				categoryTag: "不助燃會滅火",
				color: "#94A3B8",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "二氧化碳不可燃也不助燃，會把火熄滅！"
			},
			{
				id: "waterpour",
				name: "大量冷水",
				categoryTag: "降溫滅火",
				color: "#0284C7",
				accent: "#BAE6FD",
				isCorrect: false,
				wrongReason: "冷水會降溫低於燃點，造成熄火！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "達到燃點 (100°C+)",
		targetPh: "neutral",
		targetPhLabel: "中性點火劑",
		effectStyle: "fire",
		explanation: "燃燒三要素：可燃物、助燃物（氧氣）、達到燃點；缺一即滅火。",
		hint: "火需要氧氣和可燃物才能燒起來！",
		knowledgeTag: "空氣與燃燒"
	},
	{
		id: "sc-5-2",
		grade: 5,
		semester: "upper",
		dishName: "二氧化碳氣泡飲",
		orderRequirement: "挑選混合後能產生「二氧化碳氣泡」的酸鹼組合＋冰鎮降溫＋酸性醋滴",
		ingredients: [
			{
				id: "bakingsoda",
				name: "小蘇打粉",
				categoryTag: "碳酸氫鈉",
				color: "#F8FAFC",
				accent: "#CBD5E1",
				isCorrect: true
			},
			{
				id: "vinegar2",
				name: "白醋汁",
				categoryTag: "醋酸",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "salt2",
				name: "食鹽",
				categoryTag: "不產氣",
				color: "#E2E8F0",
				accent: "#F1F5F9",
				isCorrect: false,
				wrongReason: "食鹽加水或醋都不會冒出二氧化碳氣泡！"
			},
			{
				id: "oil2",
				name: "橄欖油",
				categoryTag: "不反應",
				color: "#84CC16",
				accent: "#ECFCCB",
				isCorrect: false,
				wrongReason: "油與小蘇打不會產生氣體！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "冰鎮氣泡 (2°C)",
		targetPh: "acid",
		targetPhLabel: "酸性醋滴啟動反應",
		effectStyle: "rainbow",
		explanation: "小蘇打（鹼性）加入醋或檸檬酸（酸性）會劇烈反應產生二氧化碳氣泡！",
		hint: "小蘇打＋醋是製造二氧化碳的經典實驗！",
		knowledgeTag: "二氧化碳製造"
	},
	{
		id: "sc-5-3",
		grade: 5,
		semester: "upper",
		dishName: "植物光合能量餐",
		orderRequirement: "挑選植物行「光合作用」所需的原料＋中溫陽光浴＋中性純水",
		ingredients: [
			{
				id: "sunlight",
				name: "金黃陽光露",
				categoryTag: "光能",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "co2air",
				name: "二氧化碳氣",
				categoryTag: "氣孔吸收",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "darkbox",
				name: "漆黑罩子",
				categoryTag: "阻斷陽光",
				color: "#1E293B",
				accent: "#475569",
				isCorrect: false,
				wrongReason: "缺乏陽光就無法進行光合作用！"
			},
			{
				id: "boilwater",
				name: "滾燙開水",
				categoryTag: "破壞葉綠體",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "沸水會燙死植物細胞喔！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "溫暖日照 (30°C)",
		targetPh: "neutral",
		targetPhLabel: "中性水分",
		effectStyle: "nature",
		explanation: "綠色植物利用葉綠體吸收陽光，把二氧化碳和水合成養分並釋放氧氣。",
		hint: "植物行光合作用需要陽光、水和二氧化碳！",
		knowledgeTag: "光合作用"
	},
	{
		id: "sc-5-4",
		grade: 5,
		semester: "lower",
		dishName: "熱傳導快炒鐵鍋",
		orderRequirement: "挑選「導熱最快的金屬」鍋具＋100°C 大火快炒＋中性醬汁",
		ingredients: [
			{
				id: "copperpan",
				name: "紅銅鍋片",
				categoryTag: "導熱極快",
				color: "#EA580C",
				accent: "#FFEDD5",
				isCorrect: true
			},
			{
				id: "ironpan",
				name: "鑄鐵片",
				categoryTag: "良好熱導體",
				color: "#475569",
				accent: "#CBD5E1",
				isCorrect: true
			},
			{
				id: "woodhandle",
				name: "木頭把手",
				categoryTag: "熱的不良導體",
				color: "#92400E",
				accent: "#FDE68A",
				isCorrect: false,
				wrongReason: "木頭導熱慢，適合當防燙握把而非受熱鍋底！"
			},
			{
				id: "foam",
				name: "保麗龍塊",
				categoryTag: "隔熱材料",
				color: "#F8FAFC",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "保麗龍是隔熱保溫材質，導熱極慢！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "大火導熱 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性高湯",
		effectStyle: "fire",
		explanation: "熱在固體中以傳導方式從高溫傳向低溫，金屬（銅、鋁、鐵）導熱遠快於木頭與塑膠。",
		hint: "鍋子本體通常用金屬，防燙握把才用木頭！",
		knowledgeTag: "熱的傳導"
	},
	{
		id: "sc-5-5",
		grade: 5,
		semester: "lower",
		dishName: "鐵釘防鏽保護派",
		orderRequirement: "挑選能「防止鐵生鏽」的保護方式＋中火烘乾＋中性塗層",
		ingredients: [
			{
				id: "oilcoat",
				name: "防鏽保護油",
				categoryTag: "隔絕水與空氣",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "paint",
				name: "防水亮漆膜",
				categoryTag: "阻隔氧氣水分",
				color: "#EC4899",
				accent: "#FCE7F3",
				isCorrect: true
			},
			{
				id: "acidrain",
				name: "酸性醋水",
				categoryTag: "加速生鏽",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "酸性水溶液會大幅加速鐵生鏽！"
			},
			{
				id: "saltwater",
				name: "濃食鹽水",
				categoryTag: "加速氧化",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: false,
				wrongReason: "海邊的鹽分水氣會讓鐵鏽得更快！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "乾燥烘烤 (55°C)",
		targetPh: "neutral",
		targetPhLabel: "中性保護膜",
		effectStyle: "nature",
		explanation: "鐵生鏽需要水與氧氣，塗油、上漆、保持乾燥可有效隔絕空氣與水分防止生鏽。",
		hint: "想想腳踏車鏈條為什麼要塗油！",
		knowledgeTag: "防鏽與氧化"
	},
	{
		id: "sc-5-6",
		grade: 5,
		semester: "upper",
		dishName: "太陽四季日影塔",
		orderRequirement: "挑選「台灣夏天正午」的太陽與影子特徵＋100°C 炎夏高溫",
		ingredients: [
			{
				id: "highsun",
				name: "高仰角太陽",
				categoryTag: "夏至仰角高",
				color: "#F97316",
				accent: "#FFEDD5",
				isCorrect: true
			},
			{
				id: "shortshadow",
				name: "超短竿影",
				categoryTag: "影長最短",
				color: "#64748B",
				accent: "#E2E8F0",
				isCorrect: true
			},
			{
				id: "longshadow",
				name: "超長斜影",
				categoryTag: "冬天正午特徵",
				color: "#334155",
				accent: "#94A3B8",
				isCorrect: false,
				wrongReason: "正午影子特別長是冬至太陽仰角低的時候！"
			},
			{
				id: "westrise",
				name: "太陽西升",
				categoryTag: "錯誤方向",
				color: "#7C3AED",
				accent: "#EDE9FE",
				isCorrect: false,
				wrongReason: "太陽固定由東方升起、西方落下！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "盛夏高溫 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清湯",
		effectStyle: "fire",
		explanation: "台灣夏季正午太陽仰角最高，物體影子最短、日照時間最長。",
		hint: "太陽越接近頭頂，影子越短！",
		knowledgeTag: "太陽與日影"
	},
	{
		id: "sc-5-7",
		grade: 5,
		semester: "lower",
		dishName: "動物恆溫暖心湯",
		orderRequirement: "挑選「恆溫動物」（鳥類與哺乳類）代表食材＋中火恆溫＋中性清湯",
		ingredients: [
			{
				id: "bird",
				name: "企鵝酥",
				categoryTag: "鳥類恆溫",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "mammal",
				name: "海豚餅",
				categoryTag: "哺乳類恆溫",
				color: "#6366F1",
				accent: "#E0E7FF",
				isCorrect: true
			},
			{
				id: "frog",
				name: "青蛙凍",
				categoryTag: "兩棲變溫",
				color: "#22C55E",
				accent: "#DCFCE7",
				isCorrect: false,
				wrongReason: "青蛙是兩棲類變溫動物，體溫隨環境變化！"
			},
			{
				id: "lizard",
				name: "蜥蜴脆片",
				categoryTag: "爬蟲變溫",
				color: "#84CC16",
				accent: "#ECFCCB",
				isCorrect: false,
				wrongReason: "蜥蜴是爬蟲類變溫動物，需要曬太陽取暖！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "恆溫 37°C 中火",
		targetPh: "neutral",
		targetPhLabel: "中性清湯",
		effectStyle: "nature",
		explanation: "哺乳類（含鯨豚蝙蝠）與鳥類屬於內溫（恆溫）動物；魚、兩棲、爬蟲多為變溫動物。",
		hint: "海豚是哺乳類，企鵝是鳥類喔！",
		knowledgeTag: "動物分類與體溫"
	},
	{
		id: "sc-5-8",
		grade: 5,
		semester: "lower",
		dishName: "聲音高低直笛盅",
		orderRequirement: "挑選讓樂器發出「較高音（高頻率）」的條件＋100°C 高亢沸騰",
		ingredients: [
			{
				id: "shortstr",
				name: "較短琴弦",
				categoryTag: "短弦高音",
				color: "#F43F5E",
				accent: "#FFE4E6",
				isCorrect: true
			},
			{
				id: "tightstr",
				name: "拉緊細弦",
				categoryTag: "細緊高音",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "thickstr",
				name: "粗鬆長弦",
				categoryTag: "低音特徵",
				color: "#475569",
				accent: "#CBD5E1",
				isCorrect: false,
				wrongReason: "又粗又長又鬆的弦振動較慢，發出的是低音！"
			},
			{
				id: "longair",
				name: "超長空氣柱",
				categoryTag: "低音特徵",
				color: "#0EA5E9",
				accent: "#BAE6FD",
				isCorrect: false,
				wrongReason: "管樂器空氣柱越長，音調越低！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "高頻沸騰 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性原味",
		effectStyle: "rainbow",
		explanation: "弦越短、越細、拉得越緊，振動頻率越高，發出的音調越高。",
		hint: "「短、細、緊」＝高音！",
		knowledgeTag: "音調高低與頻率"
	},
	{
		id: "sc-5-9",
		grade: 5,
		semester: "upper",
		dishName: "水蒸氣凝結露珠飲",
		orderRequirement: "挑選展示「水蒸氣遇冷凝結成小水珠」的實驗組＋0°C 冰涼杯壁",
		ingredients: [
			{
				id: "icecup",
				name: "冰塊玻璃杯",
				categoryTag: "冷表面凝結",
				color: "#67E8F9",
				accent: "#ECFEFF",
				isCorrect: true
			},
			{
				id: "moistair",
				name: "潮濕水氣",
				categoryTag: "空氣中水蒸氣",
				color: "#BAE6FD",
				accent: "#F0F9FF",
				isCorrect: true
			},
			{
				id: "hotlid",
				name: "滾燙乾鍋蓋",
				categoryTag: "高溫難凝結",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "太燙的表面無法讓水蒸氣凝結成水珠！"
			},
			{
				id: "drydesic",
				name: "強力乾燥劑",
				categoryTag: "吸光水氣",
				color: "#D6D3D1",
				accent: "#F5F5F4",
				isCorrect: false,
				wrongReason: "乾燥劑會吸走空氣中的水分！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "冰冷凝結 (0°C)",
		targetPh: "neutral",
		targetPhLabel: "中性露珠水",
		effectStyle: "ice",
		explanation: "冰杯外壁的小水珠不是滲出來的，而是空氣中看不見的水蒸氣遇冷凝結而成！",
		hint: "冰杯子遇到空氣水氣就會冒汗！",
		knowledgeTag: "凝結現象"
	},
	{
		id: "sc-5-10",
		grade: 5,
		semester: "lower",
		dishName: "熱對流旋轉火鍋",
		orderRequirement: "挑選展現「液體熱對流（熱水上升、冷水下降）」的材料＋100°C 底部加熱",
		ingredients: [
			{
				id: "bottomheat",
				name: "鍋底均勻火源",
				categoryTag: "底熱上升",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: true
			},
			{
				id: "tealeaf",
				name: "茶葉示蹤粒",
				categoryTag: "觀察上下對流",
				color: "#22C55E",
				accent: "#DCFCE7",
				isCorrect: true
			},
			{
				id: "topheat",
				name: "只加熱水面",
				categoryTag: "不易對流",
				color: "#F97316",
				accent: "#FFEDD5",
				isCorrect: false,
				wrongReason: "熱水本來就輕而在上方，只加熱水面很難形成對流！"
			},
			{
				id: "solidice",
				name: "全固體冰塊",
				categoryTag: "固體不對流",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: false,
				wrongReason: "對流主要發生在液體與氣體流體中！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "滾燙對流 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性昆布湯",
		effectStyle: "fire",
		explanation: "受熱的水變輕往上升，上方冷水下沉補充，形成循環的熱對流，故加熱器常放下方。",
		hint: "冷氣裝在上方、煮湯火源在下方，都是利用熱對流！",
		knowledgeTag: "熱的對流"
	},
	{
		id: "sc-5-11",
		grade: 5,
		semester: "upper",
		dishName: "植物輸水維管湯",
		orderRequirement: "挑選植物吸收與運輸水分的關鍵路徑＋中溫慢熬＋中性清水",
		ingredients: [
			{
				id: "rootabs",
				name: "根部根毛",
				categoryTag: "吸收水分",
				color: "#D97706",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "stemtube",
				name: "莖部維管束",
				categoryTag: "向上運輸",
				color: "#16A34A",
				accent: "#DCFCE7",
				isCorrect: true
			},
			{
				id: "flowerpot",
				name: "塑膠花盆",
				categoryTag: "容器非構造",
				color: "#94A3B8",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "花盆是外部容器，不是植物的器官！"
			},
			{
				id: "waxlayer",
				name: "防水蠟塊",
				categoryTag: "阻擋吸水",
				color: "#FDE047",
				accent: "#FEFCE8",
				isCorrect: false,
				wrongReason: "蠟會封住切口阻礙水分運送！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "溫和萃取 (50°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清水",
		effectStyle: "nature",
		explanation: "水分由根吸收，經莖內的導管（維管束）向上運送至葉片，並從氣孔蒸散。",
		hint: "把芹菜插進紅墨水，切開莖可以看到紅點點！",
		knowledgeTag: "植物水分運輸"
	},
	{
		id: "sc-5-12",
		grade: 5,
		semester: "upper",
		dishName: "星空北極星冰沙",
		orderRequirement: "挑選用來尋找「北極星」的著名星座糖片＋0°C 星空急凍",
		ingredients: [
			{
				id: "bigdipper",
				name: "北斗七星餅",
				categoryTag: "大熊座指極",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "cassio",
				name: "仙后座W餅",
				categoryTag: "秋冬找北極星",
				color: "#A855F7",
				accent: "#F3E8FF",
				isCorrect: true
			},
			{
				id: "scorpio",
				name: "天蠍座糖",
				categoryTag: "夏季南方星空",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "天蠍座在南方天空，不是找北極星的主要指標！"
			},
			{
				id: "mooncake",
				name: "滿月餅",
				categoryTag: "衛星非恆星",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: false,
				wrongReason: "月亮位置天天變動，無法用來定北方！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "極寒星空 (0°C)",
		targetPh: "neutral",
		targetPhLabel: "中性星空凍",
		effectStyle: "ice",
		explanation: "春夏可用北斗七星勺口延伸 5 倍找北極星，秋冬則可利用 W 形的仙后座尋找！",
		hint: "大熊座北斗七星和 W 形的仙后座！",
		knowledgeTag: "認識星空與北極星"
	},
	{
		id: "sc-5-13",
		grade: 5,
		semester: "lower",
		dishName: "食物保存滅菌燉菜",
		orderRequirement: "挑選可「抑制黴菌滋生」的保存方法＋100°C 高溫殺菌",
		ingredients: [
			{
				id: "dry",
				name: "乾燥脫水",
				categoryTag: "去除水分",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "vacuumpack",
				name: "真空密封",
				categoryTag: "隔絕空氣",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "warmwet",
				name: "溫暖潮濕蓋",
				categoryTag: "黴菌最愛",
				color: "#65A30D",
				accent: "#ECFCCB",
				isCorrect: false,
				wrongReason: "溫暖潮濕的環境會讓黴菌以驚人速度繁殖！"
			},
			{
				id: "openwarm",
				name: "室溫久放",
				categoryTag: "容易腐敗",
				color: "#92400E",
				accent: "#FDE68A",
				isCorrect: false,
				wrongReason: "室溫久放容易滋生細菌與黴菌！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "高溫殺菌 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清湯",
		effectStyle: "fire",
		explanation: "黴菌喜歡溫暖潮濕有空氣的環境，因此乾燥、低溫冷藏、真空包裝與高溫殺菌能延長保存。",
		hint: "反其道而行：不要給黴菌水分和空氣！",
		knowledgeTag: "微生物與食品保存"
	},
	{
		id: "sc-6-1",
		grade: 6,
		semester: "upper",
		dishName: "電磁鐵超能咖哩",
		orderRequirement: "挑選讓「電磁鐵磁力變強」的改造原料＋100°C 全力激發",
		ingredients: [
			{
				id: "morecoils",
				name: "加倍漆包線圈",
				categoryTag: "增加線圈數",
				color: "#EA580C",
				accent: "#FFEDD5",
				isCorrect: true
			},
			{
				id: "morebat",
				name: "串聯更多電池",
				categoryTag: "增大電流",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "plasticcore",
				name: "塑膠棒軸心",
				categoryTag: "無法磁化",
				color: "#94A3B8",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "塑膠棒不能被磁化，要放鐵棒或鐵釘才能大幅增強磁力！"
			},
			{
				id: "fewercoils",
				name: "減少線圈",
				categoryTag: "磁力減弱",
				color: "#64748B",
				accent: "#CBD5E1",
				isCorrect: false,
				wrongReason: "線圈繞得越少，電磁鐵磁力會變弱喔！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "高壓通電 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性咖哩底",
		effectStyle: "fire",
		explanation: "增加電池串聯數、增加線圈匝數、或在線圈內放入軟鐵棒，皆能增強電磁鐵磁力！",
		hint: "電池多＋線圈多＝超強電磁鐵！",
		knowledgeTag: "電磁鐵磁力"
	},
	{
		id: "sc-6-2",
		grade: 6,
		semester: "upper",
		dishName: "省力槓桿漢堡塔",
		orderRequirement: "挑選屬於「省力槓桿（施力臂＞抗力臂）」的料理工具＋中火煎烤",
		ingredients: [
			{
				id: "opener",
				name: "開瓶器",
				categoryTag: "施力臂較長",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "nutcracker",
				name: "胡桃鉗",
				categoryTag: "省力槓桿",
				color: "#B45309",
				accent: "#FDE68A",
				isCorrect: true
			},
			{
				id: "chopsticks",
				name: "長筷子",
				categoryTag: "費力省時",
				color: "#92400E",
				accent: "#FED7AA",
				isCorrect: false,
				wrongReason: "筷子支點在頂端、施力點在中間，屬於費力槓桿！"
			},
			{
				id: "tweezers",
				name: "麵包夾子",
				categoryTag: "費力操作準",
				color: "#94A3B8",
				accent: "#F1F5F9",
				isCorrect: false,
				wrongReason: "夾子抗力臂比施力臂長，屬於費力但方便操作的槓桿！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "黃金中火 (65°C)",
		targetPh: "neutral",
		targetPhLabel: "中性肉汁",
		effectStyle: "fire",
		explanation: "當施力臂大於抗力臂時可省力，例如開瓶器、胡桃鉗與剪鐵絲用的老虎鉗。",
		hint: "想想哪兩種工具能輕鬆撬開或夾碎硬東西！",
		knowledgeTag: "槓桿原理"
	},
	{
		id: "sc-6-3",
		grade: 6,
		semester: "upper",
		dishName: "河流侵蝕峽谷派",
		orderRequirement: "挑選「河流上游」常見的地質與水流特徵＋0°C 高山冰泉",
		ingredients: [
			{
				id: "steep",
				name: "陡峭峽谷坡",
				categoryTag: "侵蝕作用強",
				color: "#78716C",
				accent: "#E7E5E4",
				isCorrect: true
			},
			{
				id: "boulder",
				name: "巨大菱角岩",
				categoryTag: "尚未磨圓",
				color: "#64748B",
				accent: "#CBD5E1",
				isCorrect: true
			},
			{
				id: "delta",
				name: "寬廣沖積平原",
				categoryTag: "下游堆積特徵",
				color: "#D97706",
				accent: "#FEF3C7",
				isCorrect: false,
				wrongReason: "寬廣平原與細沙主要是河流下游「堆積作用」形成！"
			},
			{
				id: "finesand",
				name: "極細海灘沙",
				categoryTag: "出海口堆積",
				color: "#FDE047",
				accent: "#FEFCE8",
				isCorrect: false,
				wrongReason: "細沙通常被搬運到下游與出海口堆積！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "高山冷泉 (5°C)",
		targetPh: "neutral",
		targetPhLabel: "中性溪水",
		effectStyle: "ice",
		explanation: "河流上游坡度陡、水流急，以侵蝕作用為主，河床多見巨大且帶稜角的岩石。",
		hint: "上游水流最急，大石頭還沒被磨成細沙！",
		knowledgeTag: "流水地質作用"
	},
	{
		id: "sc-6-4",
		grade: 6,
		semester: "lower",
		dishName: "滑輪省力吊鍋",
		orderRequirement: "挑選真正「可以省力」的機械裝置＋中火吊煮＋中性高湯",
		ingredients: [
			{
				id: "movable",
				name: "動滑輪組",
				categoryTag: "可省一半力",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "wheelaxle",
				name: "大輪帶小軸",
				categoryTag: "輪軸省力",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "fixedpulley",
				name: "單個定滑輪",
				categoryTag: "只改方向不省力",
				color: "#64748B",
				accent: "#CBD5E1",
				isCorrect: false,
				wrongReason: "定滑輪只能改變施力方向，施力大小等於物重，不省力喔！"
			},
			{
				id: "smallwheel",
				name: "軸轉動大輪",
				categoryTag: "費力裝置",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "施力在小軸上帶動大輪是費力的！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "穩定中火 (60°C)",
		targetPh: "neutral",
		targetPhLabel: "中性高湯",
		effectStyle: "nature",
		explanation: "動滑輪由兩段繩子分擔重量可省一半力；施力在大輪上帶動小軸（如方向盤）也能省力。",
		hint: "動滑輪省力，定滑輪只改方向！",
		knowledgeTag: "滑輪與輪軸"
	},
	{
		id: "sc-6-5",
		grade: 6,
		semester: "lower",
		dishName: "生態食物鏈便當",
		orderRequirement: "挑選生態系中的「生產者」食材＋中火鮮煮＋中性泉水",
		ingredients: [
			{
				id: "algae",
				name: "綠色海藻",
				categoryTag: "行光合作用",
				color: "#16A34A",
				accent: "#DCFCE7",
				isCorrect: true
			},
			{
				id: "riceplant",
				name: "金黃稻穗",
				categoryTag: "綠色植物",
				color: "#EAB308",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "rabbitmeat",
				name: "草食野兔",
				categoryTag: "初級消費者",
				color: "#F8FAFC",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "兔子要吃植物維生，屬於消費者而非生產者！"
			},
			{
				id: "mushroom",
				name: "香菇真菌",
				categoryTag: "分解者",
				color: "#92400E",
				accent: "#FDE68A",
				isCorrect: false,
				wrongReason: "蕈類不含葉綠體，扮演生態系的分解者！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "鮮甜中火 (60°C)",
		targetPh: "neutral",
		targetPhLabel: "中性清湯",
		effectStyle: "nature",
		explanation: "綠色植物與藻類能自行進行光合作用製造養分，是食物鏈最底層的生產者。",
		hint: "能自己曬太陽做食物的綠色生物！",
		knowledgeTag: "食物鏈與生態系"
	},
	{
		id: "sc-6-6",
		grade: 6,
		semester: "upper",
		dishName: "天氣鋒面冰火鍋",
		orderRequirement: "挑選形成「颱風或低氣壓豪雨」的氣象要件＋100°C 蒸發水氣",
		ingredients: [
			{
				id: "warmsea",
				name: "溫暖熱帶洋面",
				categoryTag: "提供大量水氣",
				color: "#0EA5E9",
				accent: "#BAE6FD",
				isCorrect: true
			},
			{
				id: "lowpress",
				name: "熱帶低氣壓",
				categoryTag: "氣流輻合上升",
				color: "#6366F1",
				accent: "#E0E7FF",
				isCorrect: true
			},
			{
				id: "desert",
				name: "乾燥內陸沙漠",
				categoryTag: "缺乏水氣減弱",
				color: "#D97706",
				accent: "#FEF3C7",
				isCorrect: false,
				wrongReason: "颱風登陸乾燥陸地後因失去水氣與地形摩擦會迅速減弱！"
			},
			{
				id: "highcold",
				name: "大陸冷高壓",
				categoryTag: "乾冷晴朗",
				color: "#94A3B8",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "冷高壓籠罩時氣流下沉，多帶來乾冷天氣！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "蒸騰對流 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性海鹽湯",
		effectStyle: "rainbow",
		explanation: "颱風生成於溫度高於 26°C 的熱帶海洋低氣壓區，吸收暖濕水氣釋放潛熱增強。",
		hint: "颱風需要溫暖海面和低氣壓！",
		knowledgeTag: "氣象與颱風"
	},
	{
		id: "sc-6-7",
		grade: 6,
		semester: "lower",
		dishName: "酸雨中和守護湯",
		orderRequirement: "挑選會造成「酸雨」的空氣汙染來源警示物＋中火淨化＋鹼性中和試劑",
		ingredients: [
			{
				id: "so2",
				name: "二氧化硫煙",
				categoryTag: "石化燃燒",
				color: "#EAB308",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "nox",
				name: "氮氧化物氣",
				categoryTag: "汽機車廢氣",
				color: "#F97316",
				accent: "#FFEDD5",
				isCorrect: true
			},
			{
				id: "o2pure",
				name: "森林氧氣",
				categoryTag: "清新空氣",
				color: "#22C55E",
				accent: "#DCFCE7",
				isCorrect: false,
				wrongReason: "氧氣不會造成酸雨，是生物呼吸必需氣體！"
			},
			{
				id: "vapor",
				name: "純水蒸氣",
				categoryTag: "中性雲霧",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: false,
				wrongReason: "純水蒸氣本身不會形成強酸雨！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "淨化中溫 (55°C)",
		targetPh: "alkali",
		targetPhLabel: "鹼性中和酸雨",
		effectStyle: "rainbow",
		explanation: "化石燃料燃燒排放的硫氧化物與氮氧化物溶於雨水形成酸雨，需用減碳與鹼性緩衝改善。",
		hint: "找出工廠與排氣管排放的汙染氣體！",
		knowledgeTag: "環境保護與酸雨"
	},
	{
		id: "sc-6-8",
		grade: 6,
		semester: "upper",
		dishName: "岩石礦物寶石糕",
		orderRequirement: "挑選由「火山熔岩冷卻」形成的火成岩代表＋100°C 熔岩炙熱",
		ingredients: [
			{
				id: "granite",
				name: "花崗岩酥",
				categoryTag: "深成火成岩",
				color: "#EC4899",
				accent: "#FCE7F3",
				isCorrect: true
			},
			{
				id: "basalt",
				name: "玄武岩柱",
				categoryTag: "噴出火成岩",
				color: "#334155",
				accent: "#94A3B8",
				isCorrect: true
			},
			{
				id: "limestone",
				name: "石灰岩片",
				categoryTag: "沉積岩",
				color: "#E2E8F0",
				accent: "#F8FAFC",
				isCorrect: false,
				wrongReason: "石灰岩是由水中生物遺骸堆積膠結的沉積岩！"
			},
			{
				id: "marble2",
				name: "大理岩糕",
				categoryTag: "變質岩",
				color: "#CBD5E1",
				accent: "#F1F5F9",
				isCorrect: false,
				wrongReason: "大理岩是石灰岩受高溫高壓變質而成的變質岩！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "岩漿高溫 (100°C+)",
		targetPh: "neutral",
		targetPhLabel: "中性礦物水",
		effectStyle: "fire",
		explanation: "花崗岩與澎湖常見的柱狀玄武岩皆由岩漿冷卻凝固形成，屬於火成岩。",
		hint: "想想澎湖的玄武岩和堅硬的花崗岩！",
		knowledgeTag: "岩石三大分類"
	},
	{
		id: "sc-6-9",
		grade: 6,
		semester: "lower",
		dishName: "齒輪傳動甜點盒",
		orderRequirement: "挑選正確描述「嚙合齒輪」運作的原則＋中火組裝＋中性奶油",
		ingredients: [
			{
				id: "oppdir",
				name: "相鄰反向轉動",
				categoryTag: "一順一逆",
				color: "#3B82F6",
				accent: "#DBEAFE",
				isCorrect: true
			},
			{
				id: "smallfast",
				name: "小齒輪轉較快",
				categoryTag: "齒數少轉速快",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "samedir",
				name: "相鄰同方向轉",
				categoryTag: "咬合錯誤",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "直接嚙合的兩個齒輪轉動方向一定相反！"
			},
			{
				id: "bigfast",
				name: "大齒輪轉較快",
				categoryTag: "轉速錯誤",
				color: "#64748B",
				accent: "#CBD5E1",
				isCorrect: false,
				wrongReason: "大齒輪轉 1 圈時，齒數少的小齒輪會轉更多圈！"
			}
		],
		targetTempZone: "simmer",
		targetTempLabel: "精密中溫 (50°C)",
		targetPh: "neutral",
		targetPhLabel: "中性潤滑蜜",
		effectStyle: "rainbow",
		explanation: "互相咬合的兩個齒輪轉向相反，且齒數越少的齒輪轉速越快。",
		hint: "大齒輪帶小齒輪，小齒輪轉得超快且方向相反！",
		knowledgeTag: "齒輪與傳動"
	},
	{
		id: "sc-6-10",
		grade: 6,
		semester: "upper",
		dishName: "顯微細胞果凍杯",
		orderRequirement: "挑選「植物細胞特有、動物細胞沒有」的構造＋急凍透明成型",
		ingredients: [
			{
				id: "cellwall",
				name: "堅固細胞壁",
				categoryTag: "植物特有",
				color: "#22C55E",
				accent: "#DCFCE7",
				isCorrect: true
			},
			{
				id: "chloroplast",
				name: "翡翠葉綠體",
				categoryTag: "植物特有",
				color: "#10B981",
				accent: "#D1FAE5",
				isCorrect: true
			},
			{
				id: "nucleus",
				name: "細胞核丸",
				categoryTag: "動植物皆有",
				color: "#8B5CF6",
				accent: "#EDE9FE",
				isCorrect: false,
				wrongReason: "動物細胞與植物細胞都有細胞核控制生命活動！"
			},
			{
				id: "membrane",
				name: "細胞膜衣",
				categoryTag: "動植物皆有",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: false,
				wrongReason: "細胞膜是所有細胞控制物質進出的基本構造！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "低溫凍片 (2°C)",
		targetPh: "neutral",
		targetPhLabel: "中性染劑",
		effectStyle: "nature",
		explanation: "植物細胞比動物細胞多出堅硬的「細胞壁」，且綠色部位含有進行光合作用的「葉綠體」。",
		hint: "植物能直立又會行光合作用靠哪兩個構造？",
		knowledgeTag: "動植物細胞差異"
	},
	{
		id: "sc-6-11",
		grade: 6,
		semester: "lower",
		dishName: "摩擦力煞車鬆餅",
		orderRequirement: "挑選可以「減少摩擦力」讓滑行更順暢的做法＋0°C 冰面溜滑",
		ingredients: [
			{
				id: "lube",
				name: "滑順潤滑油",
				categoryTag: "降低摩擦",
				color: "#FACC15",
				accent: "#FEF9C3",
				isCorrect: true
			},
			{
				id: "wheel",
				name: "滾動培林輪",
				categoryTag: "滑動變滾動",
				color: "#38BDF8",
				accent: "#E0F2FE",
				isCorrect: true
			},
			{
				id: "tread",
				name: "深紋橡膠鞋底",
				categoryTag: "增加摩擦力",
				color: "#334155",
				accent: "#94A3B8",
				isCorrect: false,
				wrongReason: "鞋底刻紋是為了增加摩擦力防止滑倒！"
			},
			{
				id: "sandpaper",
				name: "粗糙砂紙",
				categoryTag: "大幅增摩擦",
				color: "#B45309",
				accent: "#FDE68A",
				isCorrect: false,
				wrongReason: "表面越粗糙摩擦力越大！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "光滑冰面 (0°C)",
		targetPh: "neutral",
		targetPhLabel: "中性糖霜",
		effectStyle: "ice",
		explanation: "加潤滑油、將接觸面變光滑、或加裝滾輪（滾動摩擦小於滑動摩擦）都能減少摩擦力。",
		hint: "想想腳踏車怎麼讓輪子轉得順！",
		knowledgeTag: "摩擦力應用"
	},
	{
		id: "sc-6-12",
		grade: 6,
		semester: "upper",
		dishName: "碳中和綠芽冷飲",
		orderRequirement: "挑選能有效「減少溫室氣體碳排放」的行動＋急凍降溫地球＋中性泉水",
		ingredients: [
			{
				id: "planttree",
				name: "植樹造林葉",
				categoryTag: "固碳吸CO2",
				color: "#16A34A",
				accent: "#DCFCE7",
				isCorrect: true
			},
			{
				id: "publictrans",
				name: "綠能大眾運輸",
				categoryTag: "低碳節能",
				color: "#0EA5E9",
				accent: "#BAE6FD",
				isCorrect: true
			},
			{
				id: "wasteac",
				name: "開冷氣開窗",
				categoryTag: "耗電增排碳",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: false,
				wrongReason: "浪費電力會增加火力發電的碳排放！"
			},
			{
				id: "singleuse",
				name: "大量一次性塑膠",
				categoryTag: "高碳足跡",
				color: "#94A3B8",
				accent: "#E2E8F0",
				isCorrect: false,
				wrongReason: "製造與焚燒塑膠製品會增加溫室氣體！"
			}
		],
		targetTempZone: "freeze",
		targetTempLabel: "幫地球降溫 (0°C)",
		targetPh: "neutral",
		targetPhLabel: "中性純淨水",
		effectStyle: "nature",
		explanation: "種樹吸收二氧化碳與搭乘大眾運輸減少化石燃料消耗，是減緩全球暖化的重要行動。",
		hint: "選最環保、最減碳的兩項做法！",
		knowledgeTag: "全球暖化與節能減碳"
	},
	{
		id: "sc-6-13",
		grade: 6,
		semester: "lower",
		dishName: "電磁發電閃耀湯",
		orderRequirement: "挑選「手搖發電機」將動能轉換成電能的必備元件＋100°C 能量沸騰",
		ingredients: [
			{
				id: "magnet",
				name: "強力永久磁鐵",
				categoryTag: "提供磁場",
				color: "#EF4444",
				accent: "#FEE2E2",
				isCorrect: true
			},
			{
				id: "coppercoil",
				name: "旋轉銅線圈",
				categoryTag: "切割磁力線",
				color: "#F59E0B",
				accent: "#FEF3C7",
				isCorrect: true
			},
			{
				id: "glassrod",
				name: "玻璃棒",
				categoryTag: "非導體無感應",
				color: "#CBD5E1",
				accent: "#F8FAFC",
				isCorrect: false,
				wrongReason: "玻璃棒無法產生感應電流！"
			},
			{
				id: "wooddisk",
				name: "木頭圓盤",
				categoryTag: "無磁性不導電",
				color: "#92400E",
				accent: "#FDE68A",
				isCorrect: false,
				wrongReason: "木頭沒有磁場也不能導電！"
			}
		],
		targetTempZone: "boil",
		targetTempLabel: "動能發電 (100°C)",
		targetPh: "neutral",
		targetPhLabel: "中性電解質",
		effectStyle: "rainbow",
		explanation: "線圈在磁場中持續相對運動會產生感應電流，這是手搖與風力發電機的核心原理！",
		hint: "發電機裡面一定要有磁鐵和銅線圈！",
		knowledgeTag: "電磁感應與發電"
	}
].map((d) => {
	const correctList = d.ingredients.filter((i) => i.isCorrect).map((i) => i.name).join("＋");
	return {
		id: d.id,
		grade: d.grade,
		semester: d.semester,
		subject: "science",
		type: "dish",
		prompt: `【${d.dishName}】${d.orderRequirement}`,
		answer: `${correctList} / ${d.targetTempLabel} / ${d.targetPhLabel}`,
		explanation: d.explanation,
		hint: d.hint,
		knowledgeTag: d.knowledgeTag,
		payload: {
			dishName: d.dishName,
			orderRequirement: d.orderRequirement,
			neededCount: d.ingredients.filter((i) => i.isCorrect).length,
			ingredients: d.ingredients,
			targetTempZone: d.targetTempZone,
			targetTempLabel: d.targetTempLabel,
			targetPh: d.targetPh,
			targetPhLabel: d.targetPhLabel,
			effectStyle: d.effectStyle
		}
	};
});
// src/data/questions/bonusQuestions.ts
var BONUS_CHINESE_QUESTIONS = [
	{
		id: "ch-b-3-1",
		grade: 3,
		semester: "upper",
		subject: "chinese",
		type: "slash",
		prompt: "「畫蛇添足」用來比喻做什麼樣的事？",
		payload: {
			mode: "slash",
			options: [
				"多此一舉反弄巧成拙",
				"畫圖技巧非常高超",
				"動作十分敏捷快速",
				"團體合作很有默契"
			],
			correctIndex: 0
		},
		answer: "多此一舉反弄巧成拙",
		explanation: "「畫蛇添足」指替畫好的蛇加上腳，比喻做了多餘的事反而壞事。",
		hint: "蛇本來沒有腳，硬畫上去反而多餘。",
		knowledgeTag: "成語典故"
	},
	{
		id: "ch-b-4-1",
		grade: 4,
		semester: "upper",
		subject: "chinese",
		type: "slash",
		prompt: "「井底之蛙」形容一個人的見識如何？",
		payload: {
			mode: "slash",
			options: [
				"見識短淺自大",
				"學問淵博寬廣",
				"擅長跳躍運動",
				"個性溫和謙虛"
			],
			correctIndex: 0
		},
		answer: "見識短淺自大",
		explanation: "井底青蛙只看得到井口大小的天空，用來比喻見識狹窄的人。",
		hint: "待在井底只能看到很小一片天空。",
		knowledgeTag: "寓言成語"
	},
	{
		id: "ch-b-4-2",
		grade: 4,
		semester: "lower",
		subject: "chinese",
		type: "slash",
		prompt: "「春風吹又生」的前一句詩是？",
		payload: {
			mode: "slash",
			options: [
				"野火燒不盡",
				"床前明月光",
				"白日依山盡",
				"鋤禾日當午"
			],
			correctIndex: 0
		},
		answer: "野火燒不盡",
		explanation: "白居易《賦得古原草送別》：「野火燒不盡，春風吹又生。」",
		hint: "形容草原生命力頑強，連野火都燒不完。",
		knowledgeTag: "唐詩賞析"
	},
	{
		id: "ch-b-5-1",
		grade: 5,
		semester: "upper",
		subject: "chinese",
		type: "slash",
		prompt: "「溫故知新」提醒我們讀書要怎麼做？",
		payload: {
			mode: "slash",
			options: [
				"複習舊知識獲得新體會",
				"只讀新書忘掉舊書",
				"冬天要多穿保暖衣物",
				"每天背誦一百個生字"
			],
			correctIndex: 0
		},
		answer: "複習舊知識獲得新體會",
		explanation: "出自《論語》，溫習學過的知識能從中領悟新的道理。",
		hint: "「故」是舊知識，「新」是新領悟。",
		knowledgeTag: "論語名句"
	},
	{
		id: "ch-b-5-2",
		grade: 5,
		semester: "lower",
		subject: "chinese",
		type: "slash",
		prompt: "下列哪一句使用了「擬人法」修辭？",
		payload: {
			mode: "slash",
			options: [
				"微風輕輕撫摸著稻穗的臉龐",
				"太陽像一顆巨大的火球",
				"這座山高得快碰見白雲",
				"教室裡安靜得連針掉下來都聽得見"
			],
			correctIndex: 0
		},
		answer: "微風輕輕撫摸著稻穗的臉龐",
		explanation: "賦予微風「撫摸」與稻穗「臉龐」的人類動作與特徵，屬於擬人法。",
		hint: "找把自然景物當成人來寫的句子。",
		knowledgeTag: "修辭技巧"
	},
	{
		id: "ch-b-6-1",
		grade: 6,
		semester: "upper",
		subject: "chinese",
		type: "slash",
		prompt: "「不恥下問」的真正含義是？",
		payload: {
			mode: "slash",
			options: [
				"不以向地位或學問不如自己的人請教為恥",
				"不喜歡在課堂上發問",
				"向下屬發號施令很驕傲",
				"害怕問題太簡單不敢問"
			],
			correctIndex: 0
		},
		answer: "不以向地位或學問不如自己的人請教為恥",
		explanation: "形容虛心好學，就算對方年紀或地位比自己低也樂意請教。",
		hint: "「恥」指覺得丟臉，「下問」指向下方或晚輩請教。",
		knowledgeTag: "成語精解"
	}
];
var BONUS_ENGLISH_QUESTIONS = [
	{
		id: "en-b-3-1",
		grade: 3,
		semester: "upper",
		subject: "english",
		type: "listen",
		prompt: "選出「圖書館」的正確英文單字",
		payload: {
			mode: "listen",
			speakText: "library",
			zhMeaning: "圖書館",
			choices: [
				"library",
				"kitchen",
				"garden",
				"market"
			],
			correctIndex: 0
		},
		answer: "library",
		explanation: "library 指圖書館，是借書與閱讀的地方。",
		hint: "開頭發音 /laɪ/。",
		knowledgeTag: "校園場所單字"
	},
	{
		id: "en-b-4-1",
		grade: 4,
		semester: "upper",
		subject: "english",
		type: "fill",
		prompt: "完成句子：She ___ to school by bus every morning.",
		payload: {
			mode: "fill",
			speakText: "She goes to school by bus every morning.",
			zhMeaning: "她每天早上搭公車上學",
			choices: [
				"goes",
				"go",
				"going",
				"went"
			],
			correctIndex: 0
		},
		answer: "goes",
		explanation: "第三人稱單數 She 搭配現在簡單式習慣，go 需加上 es 變成 goes。",
		hint: "主詞是 She，現在簡單式動詞字尾要變化。",
		knowledgeTag: "第三人稱單數動詞"
	},
	{
		id: "en-b-4-2",
		grade: 4,
		semester: "lower",
		subject: "english",
		type: "listen",
		prompt: "選出「星期三」的正確拼法",
		payload: {
			mode: "listen",
			speakText: "Wednesday",
			zhMeaning: "星期三",
			choices: [
				"Wednesday",
				"Tuesday",
				"Thursday",
				"Saturday"
			],
			correctIndex: 0
		},
		answer: "Wednesday",
		explanation: "Wednesday（星期三）中間的字母 d 不發音，但拼寫不可省略！",
		hint: "Wed + nes + day。",
		knowledgeTag: "星期單字"
	},
	{
		id: "en-b-5-1",
		grade: 5,
		semester: "upper",
		subject: "english",
		type: "fill",
		prompt: "完成問句：___ is your favorite subject? — Science!",
		payload: {
			mode: "fill",
			speakText: "What is your favorite subject?",
			zhMeaning: "你最喜歡的科目是什麼？",
			choices: [
				"What",
				"Who",
				"Where",
				"When"
			],
			correctIndex: 0
		},
		answer: "What",
		explanation: "詢問「什麼」事物或科目時，疑問詞使用 What。",
		hint: "詢問科目名稱用「什麼」。",
		knowledgeTag: "疑問詞用法"
	},
	{
		id: "en-b-5-2",
		grade: 5,
		semester: "lower",
		subject: "english",
		type: "listen",
		prompt: "選出「科學實驗」相關單字：博物館",
		payload: {
			mode: "listen",
			speakText: "museum",
			zhMeaning: "博物館",
			choices: [
				"museum",
				"hospital",
				"bakery",
				"station"
			],
			correctIndex: 0
		},
		answer: "museum",
		explanation: "museum 表示博物館，例如 science museum（科學博物館）。",
		hint: "以 mu- 開頭。",
		knowledgeTag: "公共場所詞彙"
	},
	{
		id: "en-b-6-1",
		grade: 6,
		semester: "upper",
		subject: "english",
		type: "fill",
		prompt: "完成過去式句子：We ___ a great movie yesterday.",
		payload: {
			mode: "fill",
			speakText: "We watched a great movie yesterday.",
			zhMeaning: "我們昨天看了一部很棒的電影",
			choices: [
				"watched",
				"watch",
				"watching",
				"watches"
			],
			correctIndex: 0
		},
		answer: "watched",
		explanation: "時間副詞 yesterday 表示過去時間，規則動詞 watch 需加 ed 變成 watched。",
		hint: "看到 yesterday 要用過去式。",
		knowledgeTag: "過去簡單式"
	}
];
var BONUS_MATH_QUESTIONS = [
	{
		id: "ma-b-3-1",
		grade: 3,
		semester: "upper",
		subject: "math",
		type: "calc",
		prompt: "一盒鉛筆有 12 枝，買 4 盒共有幾枝鉛筆？",
		payload: {
			formulaShield: "12 × 4 = ?",
			options: [
				"48",
				"44",
				"36",
				"52"
			],
			correctIndex: 0,
			unit: "枝"
		},
		answer: "48",
		explanation: "12 × 4 = (10 × 4) + (2 × 4) = 40 + 8 = 48 枝。",
		hint: "先算 10×4 再加 2×4。",
		knowledgeTag: "二位數乘法"
	},
	{
		id: "ma-b-4-1",
		grade: 4,
		semester: "upper",
		subject: "math",
		type: "geometry",
		prompt: "正方形邊長為 9 公分，它的面積是多少平方公分？",
		payload: {
			formulaShield: "9 × 9 = ?",
			options: [
				"81",
				"36",
				"72",
				"90"
			],
			correctIndex: 0,
			unit: "平方公分"
		},
		answer: "81",
		explanation: "正方形面積 = 邊長 × 邊長 = 9 × 9 = 81 平方公分（周長才是 36）。",
		hint: "面積是邊長乘以邊長。",
		knowledgeTag: "正方形面積"
	},
	{
		id: "ma-b-4-2",
		grade: 4,
		semester: "lower",
		subject: "math",
		type: "fraction",
		prompt: "計算分數加法：3/8 + 4/8 = ?",
		payload: {
			formulaShield: "3/8 + 4/8",
			options: [
				"7/8",
				"7/16",
				"1/8",
				"8/8"
			],
			correctIndex: 0
		},
		answer: "7/8",
		explanation: "同分母分數相加，分母不變仍為 8，分子相加 3 + 4 = 7，得 7/8。",
		hint: "分母一樣時，只要加分子就好。",
		knowledgeTag: "同分母分數加法"
	},
	{
		id: "ma-b-5-1",
		grade: 5,
		semester: "upper",
		subject: "math",
		type: "calc",
		prompt: "計算四則運算：25 + 15 × 4 = ?",
		payload: {
			formulaShield: "25 + 15 × 4",
			options: [
				"85",
				"160",
				"75",
				"95"
			],
			correctIndex: 0
		},
		answer: "85",
		explanation: "先乘除後加減：先算 15 × 4 = 60，再加上 25 得到 85。",
		hint: "記得要先算乘法 15 × 4！",
		knowledgeTag: "四則運算順序"
	},
	{
		id: "ma-b-5-2",
		grade: 5,
		semester: "lower",
		subject: "math",
		type: "geometry",
		prompt: "一個底為 12 公分、高為 7 公分的三角形，面積是多少？",
		payload: {
			formulaShield: "12 × 7 ÷ 2",
			options: [
				"42",
				"84",
				"38",
				"49"
			],
			correctIndex: 0,
			unit: "平方公分"
		},
		answer: "42",
		explanation: "三角形面積 = 底 × 高 ÷ 2 = 12 × 7 ÷ 2 = 42 平方公分。",
		hint: "底乘高之後別忘了除以 2。",
		knowledgeTag: "三角形面積"
	},
	{
		id: "ma-b-6-1",
		grade: 6,
		semester: "upper",
		subject: "math",
		type: "calc",
		prompt: "一輛列車 3 小時行駛 270 公里，它的平均時速是多少？",
		payload: {
			formulaShield: "270 ÷ 3 = ?",
			options: [
				"90 公里/時",
				"80 公里/時",
				"95 公里/時",
				"70 公里/時"
			],
			correctIndex: 0
		},
		answer: "90 公里/時",
		explanation: "速率 = 距離 ÷ 時間 = 270 ÷ 3 = 90 公里/時。",
		hint: "距離除以時間就是速率。",
		knowledgeTag: "速率計算"
	}
];
var BONUS_SCIENCE_QUESTIONS = [
	{
		id: "sc-b-3-1",
		grade: 3,
		semester: "upper",
		subject: "science",
		type: "dish",
		prompt: "製作「磁力吸鐵拼盤」：選出會被磁鐵吸引的金屬食材！",
		payload: {
			dishName: "磁力鐵衛拼盤",
			orderRequirement: "挑選 2 項會被磁鐵吸引的材質，並以中火溫熱、中性調和！",
			neededCount: 2,
			ingredients: [
				{
					id: "s3b-1",
					name: "鐵製迴紋針",
					categoryTag: "鐵磁性金屬",
					color: "#94A3B8",
					accent: "#E2E8F0",
					isCorrect: true
				},
				{
					id: "s3b-2",
					name: "鋼鐵小螺絲",
					categoryTag: "鐵磁性金屬",
					color: "#64748B",
					accent: "#CBD5E1",
					isCorrect: true
				},
				{
					id: "s3b-3",
					name: "塑膠積木",
					categoryTag: "非磁性",
					color: "#FACC15",
					accent: "#FEF08A",
					isCorrect: false,
					wrongReason: "塑膠不會被磁鐵吸引喔！"
				},
				{
					id: "s3b-4",
					name: "橡皮擦",
					categoryTag: "非磁性",
					color: "#FB7185",
					accent: "#FECDD3",
					isCorrect: false,
					wrongReason: "橡膠屬於非磁性物質！"
				}
			],
			targetTempZone: "simmer",
			targetTempLabel: "55°C 中火穩溫",
			targetPh: "neutral",
			targetPhLabel: "中性純水",
			effectStyle: "nature"
		},
		answer: "鐵製迴紋針＋鋼鐵小螺絲",
		explanation: "磁鐵主要吸引鐵、鈷、鎳等金屬材質，塑膠與橡皮擦都不具磁性。",
		hint: "找含「鐵」或「鋼」的物品。",
		knowledgeTag: "磁鐵與磁性"
	},
	{
		id: "sc-b-4-1",
		grade: 4,
		semester: "lower",
		subject: "science",
		type: "dish",
		prompt: "製作「毛細吸水翡翠湯」：選出能產生毛細現象的材料！",
		payload: {
			dishName: "毛細翡翠高湯",
			orderRequirement: "挑選 2 項有細縫可吸水的材料，中火烹調並保持中性！",
			neededCount: 2,
			ingredients: [
				{
					id: "s4b-1",
					name: "棉質紗布",
					categoryTag: "具細縫吸水",
					color: "#F8FAFC",
					accent: "#E2E8F0",
					isCorrect: true
				},
				{
					id: "s4b-2",
					name: "廚房紙巾",
					categoryTag: "具細縫吸水",
					color: "#FEF3C7",
					accent: "#FDE68A",
					isCorrect: true
				},
				{
					id: "s4b-3",
					name: "透明塑膠袋",
					categoryTag: "不吸水",
					color: "#38BDF8",
					accent: "#BAE6FD",
					isCorrect: false,
					wrongReason: "塑膠袋沒有毛細孔隙，無法吸水！"
				},
				{
					id: "s4b-4",
					name: "鋁箔紙",
					categoryTag: "不吸水",
					color: "#CBD5E1",
					accent: "#F1F5F9",
					isCorrect: false,
					wrongReason: "鋁箔紙表面光滑不具毛細現象！"
				}
			],
			targetTempZone: "simmer",
			targetTempLabel: "55°C 中火浸泡",
			targetPh: "neutral",
			targetPhLabel: "中性純水",
			effectStyle: "nature"
		},
		answer: "棉質紗布＋廚房紙巾",
		explanation: "水會沿著棉布、紙巾中的微小細縫往上爬，這就是毛細現象。",
		hint: "找有纖維細縫、能吸水的物品。",
		knowledgeTag: "毛細現象"
	},
	{
		id: "sc-b-4-2",
		grade: 4,
		semester: "upper",
		subject: "science",
		type: "dish",
		prompt: "製作「導電閃電濃湯」：選出容易導電的導體材料！",
		payload: {
			dishName: "閃電導體濃湯",
			orderRequirement: "挑選 2 項電流可通過的導體，沸騰加熱並加入鹼性試劑！",
			neededCount: 2,
			ingredients: [
				{
					id: "s4c-1",
					name: "紅銅電線",
					categoryTag: "電的導體",
					color: "#EA580C",
					accent: "#FDBA74",
					isCorrect: true
				},
				{
					id: "s4c-2",
					name: "金屬鐵釘",
					categoryTag: "電的導體",
					color: "#94A3B8",
					accent: "#E2E8F0",
					isCorrect: true
				},
				{
					id: "s4c-3",
					name: "乾燥木筷",
					categoryTag: "絕緣體",
					color: "#B45309",
					accent: "#FDE68A",
					isCorrect: false,
					wrongReason: "乾燥木材是絕緣體，不易導電！"
				},
				{
					id: "s4c-4",
					name: "玻璃珠",
					categoryTag: "絕緣體",
					color: "#22D3EE",
					accent: "#CFFAFE",
					isCorrect: false,
					wrongReason: "玻璃屬於絕緣體，電流無法通過！"
				}
			],
			targetTempZone: "boil",
			targetTempLabel: "100°C 沸騰活化",
			targetPh: "alkali",
			targetPhLabel: "鹼性蘇打藍",
			effectStyle: "fire"
		},
		answer: "紅銅電線＋金屬鐵釘",
		explanation: "銅、鐵等金屬是良好的電導體；乾燥木頭與玻璃則是絕緣體。",
		hint: "金屬大多數都能導電。",
		knowledgeTag: "導體與絕緣體"
	},
	{
		id: "sc-b-5-1",
		grade: 5,
		semester: "upper",
		subject: "science",
		type: "dish",
		prompt: "製作「光合能量蔬果煲」：選出植物進行光合作用所需的原料！",
		payload: {
			dishName: "光合能量蔬果煲",
			orderRequirement: "挑選 2 項光合作用原料，中火溫煮並維持中性環境！",
			neededCount: 2,
			ingredients: [
				{
					id: "s5b-1",
					name: "清澈水分",
					categoryTag: "光合原料",
					color: "#38BDF8",
					accent: "#BAE6FD",
					isCorrect: true
				},
				{
					id: "s5b-2",
					name: "二氧化碳氣泡",
					categoryTag: "光合原料",
					color: "#A855F7",
					accent: "#E9D5FF",
					isCorrect: true
				},
				{
					id: "s5b-3",
					name: "食用沙拉油",
					categoryTag: "非光合原料",
					color: "#FACC15",
					accent: "#FEF08A",
					isCorrect: false,
					wrongReason: "植物光合作用不需要沙拉油喔！"
				},
				{
					id: "s5b-4",
					name: "精製食鹽",
					categoryTag: "非光合原料",
					color: "#F8FAFC",
					accent: "#CBD5E1",
					isCorrect: false,
					wrongReason: "食鹽不是光合作用的原料！"
				}
			],
			targetTempZone: "simmer",
			targetTempLabel: "55°C 溫暖陽光火",
			targetPh: "neutral",
			targetPhLabel: "中性純水",
			effectStyle: "nature"
		},
		answer: "清澈水分＋二氧化碳氣泡",
		explanation: "綠色植物吸收陽光、水分與二氧化碳，製造養分並釋放氧氣。",
		hint: "想一想植物澆水和吸收空氣中的哪種氣體。",
		knowledgeTag: "植物光合作用"
	},
	{
		id: "sc-b-5-2",
		grade: 5,
		semester: "lower",
		subject: "science",
		type: "dish",
		prompt: "製作「星光折射彩虹凍」：選出與光線折射或色散有關的元素！",
		payload: {
			dishName: "三稜鏡彩虹果凍",
			orderRequirement: "挑選 2 項能產生折射色散的透光元件，急凍定型並加酸性試劑！",
			neededCount: 2,
			ingredients: [
				{
					id: "s5c-1",
					name: "水晶三稜鏡",
					categoryTag: "光線色散",
					color: "#EC4899",
					accent: "#FBCFE8",
					isCorrect: true
				},
				{
					id: "s5c-2",
					name: "空中細水滴",
					categoryTag: "彩虹折射",
					color: "#38BDF8",
					accent: "#BAE6FD",
					isCorrect: true
				},
				{
					id: "s5c-3",
					name: "厚黑紙板",
					categoryTag: "不透光遮蔽",
					color: "#1E293B",
					accent: "#475569",
					isCorrect: false,
					wrongReason: "厚黑紙板會擋住光線，無法折射出彩虹！"
				},
				{
					id: "s5c-4",
					name: "生鏽鐵片",
					categoryTag: "不透光金屬",
					color: "#9A3412",
					accent: "#FDBA74",
					isCorrect: false,
					wrongReason: "不透明金屬無法讓光穿透折射！"
				}
			],
			targetTempZone: "freeze",
			targetTempLabel: "0°C 急凍定型",
			targetPh: "acid",
			targetPhLabel: "酸性檸檬紅",
			effectStyle: "rainbow"
		},
		answer: "水晶三稜鏡＋空中細水滴",
		explanation: "白光穿過三稜鏡或空氣中水滴時，會因折射角度不同分解成七色彩虹！",
		hint: "雨後天晴看到彩虹需要陽光和透光水滴。",
		knowledgeTag: "光的折射與色散"
	},
	{
		id: "sc-b-6-1",
		grade: 6,
		semester: "lower",
		subject: "science",
		type: "dish",
		prompt: "製作「鐵鏽防護實驗湯」：選出會加速鐵製品生鏽的兩大條件！",
		payload: {
			dishName: "防鏽科學濃湯",
			orderRequirement: "挑選 2 項導致鐵生鏽的關鍵要素，中火實驗並以酸性催化！",
			neededCount: 2,
			ingredients: [
				{
					id: "s6b-1",
					name: "潮濕水氣",
					categoryTag: "生鏽條件",
					color: "#38BDF8",
					accent: "#BAE6FD",
					isCorrect: true
				},
				{
					id: "s6b-2",
					name: "空氣氧氣",
					categoryTag: "生鏽條件",
					color: "#22C55E",
					accent: "#BBF7D0",
					isCorrect: true
				},
				{
					id: "s6b-3",
					name: "防鏽潤滑油",
					categoryTag: "隔絕防鏽",
					color: "#F59E0B",
					accent: "#FDE68A",
					isCorrect: false,
					wrongReason: "塗油能隔絕水與空氣，反而能防止生鏽！"
				},
				{
					id: "s6b-4",
					name: "乾燥矽膠包",
					categoryTag: "除濕防鏽",
					color: "#CBD5E1",
					accent: "#F8FAFC",
					isCorrect: false,
					wrongReason: "乾燥劑會吸走水分，減緩生鏽！"
				}
			],
			targetTempZone: "simmer",
			targetTempLabel: "55°C 溫熱反應",
			targetPh: "acid",
			targetPhLabel: "酸性加速檢驗",
			effectStyle: "fire"
		},
		answer: "潮濕水氣＋空氣氧氣",
		explanation: "鐵與「水」和「氧氣」同時接觸就會氧化生鏽，酸性液體會讓生鏽更快！",
		hint: "鐵放在乾燥密封罐裡不容易生鏽，想想少了什麼。",
		knowledgeTag: "氧化與防鏽"
	}
];
// src/data/questions/epicExpansion.ts
function buildChineseSlash(rows) {
	return rows.map(([id, grade, semester, prompt, options, correctIndex, explanation, hint, knowledgeTag]) => ({
		id,
		grade,
		semester,
		subject: "chinese",
		type: "slash",
		prompt,
		payload: {
			mode: "slash",
			options,
			correctIndex
		},
		answer: options[correctIndex],
		explanation,
		hint,
		knowledgeTag
	}));
}
function buildChineseRadical(rows) {
	return rows.map(([id, grade, semester, prompt, targetChar, parts, distractors, explanation, hint, knowledgeTag]) => ({
		id,
		grade,
		semester,
		subject: "chinese",
		type: "radical",
		prompt,
		payload: {
			mode: "radical",
			partA: parts[0],
			partB: parts[1],
			pool: [
				parts[0],
				distractors[0],
				parts[1],
				distractors[1]
			],
			targetChar,
			meaning: hint
		},
		answer: targetChar,
		explanation,
		hint,
		knowledgeTag
	}));
}
function buildChineseTypo(rows) {
	return rows.map(([id, grade, semester, prompt, sentence, wrongIndex, correctChar, explanation, hint, knowledgeTag]) => ({
		id,
		grade,
		semester,
		subject: "chinese",
		type: "typo",
		prompt,
		payload: {
			mode: "typo",
			sentence,
			typoIndex: wrongIndex,
			wrongChar: sentence[wrongIndex] ?? sentence[sentence.length - 1],
			correctChar
		},
		answer: correctChar,
		explanation,
		hint,
		knowledgeTag
	}));
}
var CH_SLASH_ROWS = [
	[
		"ch-e-3-1",
		3,
		"upper",
		"「守株待兔」勸告我們做事應該如何？",
		[
			"腳踏實地努力",
			"天天在樹下睡覺",
			"只靠運氣等待",
			"養很多小兔子"
		],
		0,
		"「守株待兔」比喻不主動努力、妄想不勞而獲。",
		"農夫等著兔子自己撞樹，這樣行得通嗎？",
		"成語典故"
	],
	[
		"ch-e-3-2",
		3,
		"upper",
		"下列哪個詞語的讀音全部正確？",
		[
			"「散」步（ㄙㄢˋ）",
			"「長」大（ㄔㄤˊ）",
			"「重」新（ㄓㄨㄥˋ）",
			"「還」書（ㄏㄞˊ）"
		],
		0,
		"散步讀 ㄙㄢˋ ㄅㄨˋ；長大讀 ㄓㄤˇ；重新讀 ㄔㄨㄥˊ；還書讀 ㄏㄨㄢˊ。",
		"想想平常唸「散步」的聲調。",
		"多音字辨識"
	],
	[
		"ch-e-3-3",
		3,
		"upper",
		"「太陽公公對著小花微笑」使用了哪種修辭？",
		[
			"擬人法",
			"排比法",
			"倒裝法",
			"設問法"
		],
		0,
		"把太陽描寫成會微笑的公公，是將物比擬為人的擬人法。",
		"太陽本來不會笑，作者把它當作人來寫。",
		"修辭手法"
	],
	[
		"ch-e-3-4",
		3,
		"upper",
		"「一□□清澈的小河」量詞應該填入哪一個？",
		[
			"條",
			"本",
			"張",
			"位"
		],
		0,
		"細長彎曲的河流通常搭配量詞「條」。",
		"一條河、一條路、一條魚。",
		"量詞運用"
	],
	[
		"ch-e-3-5",
		3,
		"lower",
		"「狐假虎威」真正讓人害怕的是誰的力量？",
		[
			"老虎",
			"狐狸",
			"山羊",
			"小鹿"
		],
		0,
		"狐狸借著老虎的威勢嚇唬百獸，比喻倚仗他人勢力欺壓別人。",
		"「假」是借用的意思。",
		"寓言成語"
	],
	[
		"ch-e-3-6",
		3,
		"lower",
		"哪一個字是「水」部首？",
		[
			"清",
			"晴",
			"請",
			"精"
		],
		0,
		"「清」左邊有三點水（氵），與水流清澈有關。",
		"找左邊有三點水的字。",
		"部首結構"
	],
	[
		"ch-e-3-7",
		3,
		"lower",
		"「雖然下雨，□□我們還是準時到校。」最適合填入？",
		[
			"但是",
			"因為",
			"如果",
			"只要"
		],
		0,
		"「雖然……但是……」是常用的轉折複句關聯詞。",
		"前面說「雖然」，後面常用轉折詞。",
		"關聯詞句型"
	],
	[
		"ch-e-3-8",
		3,
		"lower",
		"「千山鳥飛絕，萬徑人蹤滅」描寫哪個季節的景色？",
		[
			"冬天",
			"春天",
			"夏天",
			"初秋"
		],
		0,
		"柳宗元《江雪》描繪大雪紛飛、萬物寂靜的寒冬景象。",
		"詩名叫做《江雪》。",
		"古詩賞析"
	],
	[
		"ch-e-4-1",
		4,
		"upper",
		"「掩耳盜鈴」比喻什麼樣的行為？",
		[
			"自欺欺人",
			"聰明伶俐",
			"樂於助人",
			"謹慎細心"
		],
		0,
		"捂住自己耳朵去偷鈴鐺，以為別人也聽不到，比喻自己欺騙自己。",
		"堵住自己的耳朵，別人其實還是聽得見。",
		"成語活用"
	],
	[
		"ch-e-4-2",
		4,
		"upper",
		"「欲窮千里目，更上一層樓」鼓勵人們怎麼做？",
		[
			"不斷進取看得更遠",
			"每天練習爬樓梯",
			"買高倍率望遠鏡",
			"搬到高樓層居住"
		],
		0,
		"王之渙《登鸛雀樓》名句，勉勵人們持續向上精進，開闊視野。",
		"站得越高，視野就越寬廣。",
		"古詩賞析"
	],
	[
		"ch-e-4-3",
		4,
		"upper",
		"下列哪個詞語用來形容「聲音非常響亮」？",
		[
			"震耳欲聾",
			"鴉雀無聲",
			"萬籟俱寂",
			"輕聲細語"
		],
		0,
		"「震耳欲聾」形容聲音大得快把耳朵震聾了。",
		"其他三個詞都形容安靜或小聲。",
		"詞語辨析"
	],
	[
		"ch-e-4-4",
		4,
		"upper",
		"「他跑得像一陣風一樣快」運用了哪種修辭？",
		[
			"譬喻法",
			"誇飾法",
			"頂真法",
			"映襯法"
		],
		0,
		"用「像」把跑步速度比喻為「一陣風」，屬於明喻（譬喻法）。",
		"句中有喻詞「像」。",
		"修辭手法"
	],
	[
		"ch-e-4-5",
		4,
		"lower",
		"「亡羊補牢」告訴我們犯錯之後應該？",
		[
			"及時補救還來得及",
			"立刻放棄不再嘗試",
			"責怪別人沒幫忙",
			"把羊群全部送走"
		],
		0,
		"羊跑掉了趕緊修補羊圈，比喻發現錯誤及時改進就不算晚。",
		"「牢」是指養羊的圈欄。",
		"成語典故"
	],
	[
		"ch-e-4-6",
		4,
		"lower",
		"書名號《 》應該用在下列哪個地方？",
		[
			"書名或文章篇名",
			"人物說的話",
			"並列詞語之間",
			"表示語氣停頓"
		],
		0,
		"書名號用來標示書籍、報刊、篇名或影視作品名稱。",
		"例如《西遊記》、《小王子》。",
		"標點符號"
	],
	[
		"ch-e-4-7",
		4,
		"lower",
		"「一舉兩得」與下列哪個成語意思最相近？",
		[
			"一箭雙鵰",
			"徒勞無功",
			"半途而廢",
			"雪上加霜"
		],
		0,
		"「一舉兩得」與「一箭雙鵰」都形容做一件事同時獲得兩種收穫。",
		"一枝箭同時射中兩隻鵰。",
		"近義成語"
	],
	[
		"ch-e-5-1",
		5,
		"upper",
		"「塞翁失馬，焉知非福」蘊含什麼人生哲理？",
		[
			"禍福相倚不必過度沮喪",
			"養馬比種田更賺錢",
			"失去東西就再也找不到",
			"住在邊塞非常危險"
		],
		0,
		"壞事有時可能轉化成好事，遇事應保持豁達與冷靜。",
		"「焉知非福」意思是怎知道不是福氣呢？",
		"成語典故"
	],
	[
		"ch-e-5-2",
		5,
		"upper",
		"「飛流直下三千尺，疑是銀河落九天」主要運用了？",
		[
			"誇飾與譬喻",
			"設問與排比",
			"雙關與借代",
			"回文與頂真"
		],
		0,
		"「三千尺」是誇飾手法，把瀑布比喻為「銀河」是譬喻手法。",
		"李白形容瀑布高得像從天河落下。",
		"修辭手法"
	],
	[
		"ch-e-5-3",
		5,
		"upper",
		"「學而不思則罔」中的「罔」字意思接近？",
		[
			"迷惘無所得",
			"網住魚群",
			"非常開心",
			"記憶力超群"
		],
		0,
		"出自《論語》，只死讀書不思考就會感到迷惑而沒有真正收穫。",
		"與「迷惘」同源。",
		"文言詞義"
	],
	[
		"ch-e-5-4",
		5,
		"upper",
		"下列哪一句的「和」是連接詞，可以換成「與」？",
		[
			"小明和小華去圖書館",
			"今天的天氣真溫和",
			"請你先和麵糰",
			"他們打成和局"
		],
		0,
		"「小明和小華」的「和」連接兩個名詞，相當於「與」。",
		"試著把「與」代入句子讀讀看。",
		"詞性辨識"
	],
	[
		"ch-e-5-5",
		5,
		"lower",
		"「破釜沉舟」表現出主角什麼樣的決心？",
		[
			"毫無退路誓死達成目標",
			"不小心打破廚房鍋具",
			"決定改搭火車旅行",
			"想要修理老舊木船"
		],
		0,
		"項羽砸破煮飯的鍋並鑿沉渡船，展現有進無退的堅定決心。",
		"「釜」是古代的鍋子。",
		"歷史成語"
	],
	[
		"ch-e-5-6",
		5,
		"lower",
		"「對牛彈琴」常用來比喻？",
		[
			"對不懂的人講深奧道理",
			"音樂家在牧場開演奏會",
			"牛群非常喜愛古典音樂",
			"勤奮練習樂器的精神"
		],
		0,
		"比喻說話不看對象，對不理解的人講述高深道理。",
		"牛聽得懂琴聲裡的高深涵義嗎？",
		"成語活用"
	],
	[
		"ch-e-5-7",
		5,
		"lower",
		"「春眠不覺曉，處處聞啼鳥」中「曉」的意思是？",
		[
			"天亮、清晨",
			"知道、明瞭",
			"小聲說話",
			"太陽下山"
		],
		0,
		"孟浩然《春曉》描寫春天睡得香甜，不知不覺就天亮了。",
		"「破曉」就是天剛亮的時候。",
		"古詩賞析"
	],
	[
		"ch-e-6-1",
		6,
		"upper",
		"「三人行，必有我師焉」教導我們抱持何種學習態度？",
		[
			"謙虛向他人優點學習",
			"出門一定要找三個人",
			"只有老師才能教學生",
			"自己讀書不需要朋友"
		],
		0,
		"出自《論語》，身邊每個人都有值得學習的長處，應謙虛取法。",
		"「擇其善者而從之」。",
		"論語名句"
	],
	[
		"ch-e-6-2",
		6,
		"upper",
		"「朱門酒肉臭，路有凍死骨」運用了哪種修辭凸顯貧富懸殊？",
		[
			"映襯法",
			"頂真法",
			"擬人法",
			"設問法"
		],
		0,
		"杜甫以豪門酒肉腐臭與路邊凍死骨形成強烈對比，是映襯修辭。",
		"一邊極度奢華，一邊極度貧苦。",
		"修辭手法"
	],
	[
		"ch-e-6-3",
		6,
		"upper",
		"「臥薪嘗膽」的主角越王勾踐展現了什麼精神？",
		[
			"刻苦自勵、忍辱負重",
			"喜愛品嘗各種苦味食物",
			"喜歡在森林裡露營",
			"不顧後果衝動行事"
		],
		0,
		"越王勾踐睡在柴草上、飯前嘗苦膽，提醒自己不忘雪恥復國。",
		"「薪」是柴草，「膽」是苦膽。",
		"歷史成語"
	],
	[
		"ch-e-6-4",
		6,
		"upper",
		"「精衛填海」與「愚公移山」共同讚揚的精神是？",
		[
			"堅持不懈的毅力",
			"投機取巧的智慧",
			"見風轉舵的圓滑",
			"半途而廢的灑脫"
		],
		0,
		"兩個神話寓言都歌頌不畏艱難、持之以恆的精神。",
		"即使工程浩大也永不放棄。",
		"閱讀推論"
	],
	[
		"ch-e-6-5",
		6,
		"lower",
		"「青出於藍，而勝於藍」常用來稱讚？",
		[
			"學生或後輩超越前人",
			"天空的顏色越來越藍",
			"衣服染色的技巧退步",
			"畫家只用藍色顏料"
		],
		0,
		"出自《荀子》，靛青從藍草提煉卻比藍草更深，比喻後生可畏、超越前輩。",
		"常用於形容徒弟超越師父。",
		"經典名句"
	],
	[
		"ch-e-6-6",
		6,
		"lower",
		"「鞠躬盡瘁，死而後已」出自哪一篇名作？",
		[
			"諸葛亮《出師表》",
			"陶淵明《桃花源記》",
			"李白《靜夜思》",
			"歐陽修《醉翁亭記》"
		],
		0,
		"諸葛亮在《後出師表》表達竭盡心力、奉獻到底的忠誠精神。",
		"三國時期蜀漢名相所寫。",
		"經典文學"
	],
	[
		"ch-e-6-7",
		6,
		"lower",
		"「物極必反」在生活上的啟示是？",
		[
			"凡事過頭反而會往反方向發展",
			"買東西一定要買最貴的",
			"物體碰到牆壁會加速",
			"越多壓力表現越好"
		],
		0,
		"事物發展到極點往往會轉向反面，提醒我們行事講求中庸平衡。",
		"例如過度熬夜讀書反而精神不濟。",
		"成語活用"
	],
	[
		"ch-e-6-8",
		6,
		"lower",
		"「海內存知己，天涯若比鄰」表達了怎樣的情感？",
		[
			"真摯友誼不受距離阻隔",
			"希望鄰居趕快搬到海邊",
			"出國旅遊一定要帶地圖",
			"感嘆大海非常遼闊危險"
		],
		0,
		"王勃《送杜少府之任蜀州》，只要心意相通，遠在天涯也像近鄰。",
		"「比鄰」是指相鄰的鄰居。",
		"古詩賞析"
	]
];
var CH_RADICAL_ROWS = [
	[
		"ch-e-3-r1",
		3,
		"upper",
		"組合偏旁召喚漢字：「有太陽也有月亮，光線非常亮！」",
		"明",
		["日", "月"],
		["木", "氵"],
		"日與月合起來就是「明」，代表光明、明亮。",
		"太陽是「日」，月亮是「月」。",
		"部首拼字"
	],
	[
		"ch-e-3-r2",
		3,
		"lower",
		"組合偏旁召喚漢字：「人靠在樹木旁邊乘涼！」",
		"休",
		["亻", "木"],
		["口", "火"],
		"人（亻）靠在樹木（木）旁就是「休」，表示休息。",
		"單人旁配樹木。",
		"部首拼字"
	],
	[
		"ch-e-4-r1",
		4,
		"upper",
		"組合偏旁召喚漢字：「女子帶著孩子，象徵美好！」",
		"好",
		["女", "子"],
		["心", "山"],
		"女與子合成「好」，本義為美善、和睦。",
		"左邊「女」，右邊「子」。",
		"部首拼字"
	],
	[
		"ch-e-4-r2",
		4,
		"lower",
		"組合偏旁召喚漢字：「三點水加上青，形容溪水澄澈！」",
		"清",
		["氵", "青"],
		["日", "言"],
		"氵＋青＝清，指水質純淨透明。",
		"水部首＋青色。",
		"部首拼字"
	],
	[
		"ch-e-5-r1",
		5,
		"upper",
		"組合偏旁召喚漢字：「門裡面有耳朵，代表仔細聽見！」",
		"聞",
		["門", "耳"],
		["口", "日"],
		"門內有耳為「聞」，本義為聽見、傳聞。",
		"「耳聞目睹」的聞。",
		"部首拼字"
	],
	[
		"ch-e-5-r2",
		5,
		"lower",
		"組合偏旁召喚漢字：「用心加上相，表示思念與思考！」",
		"想",
		["相", "心"],
		["目", "言"],
		"相＋心＝想，用腦與心去思索。",
		"上面是「相」，下面是「心」。",
		"部首拼字"
	],
	[
		"ch-e-6-r1",
		6,
		"upper",
		"組合偏旁召喚漢字：「言語加上每，表示謙虛教誨！」",
		"誨",
		["言", "每"],
		["亻", "氵"],
		"言＋每＝誨，如「循循善誘、誨人不倦」。",
		"用言語時常教導。",
		"部首拼字"
	],
	[
		"ch-e-6-r2",
		6,
		"lower",
		"組合偏旁召喚漢字：「寶蓋頭下有玉，象徵珍貴寶物！」",
		"寶",
		["宀", "玉"],
		["木", "火"],
		"屋宇（宀）珍藏玉貝即為「寶」。",
		"蓋頭＋玉石。",
		"部首拼字"
	]
];
var CH_TYPO_ROWS = [
	[
		"ch-e-3-t1",
		3,
		"upper",
		"斬碎句子中的錯別字，守護正確用字！",
		"他每天都認真的寫作葉",
		9,
		"業",
		"「作業」的業才對，不是樹葉的葉。",
		"找最後一個字！",
		"形近字"
	],
	[
		"ch-e-3-t2",
		3,
		"lower",
		"斬碎句子中的錯別字，破除魔物護盾！",
		"我們在操場上開心的完耍",
		9,
		"玩",
		"「玩耍」是王部的玩，不是完成的完。",
		"注意「完耍」哪裡怪怪的。",
		"形近字"
	],
	[
		"ch-e-4-t1",
		4,
		"upper",
		"斬碎句子中的錯別字！",
		"老師稱讚他的文章寫得非常精採",
		13,
		"彩",
		"「精彩」是彡部的彩，不是採摘的採。",
		"最後一個字錯了！",
		"字音字形"
	],
	[
		"ch-e-4-t2",
		4,
		"lower",
		"斬碎句子中的錯別字！",
		"登山前要先做好沖分的準備",
		7,
		"充",
		"「充分」的充才對，不是沖水的沖。",
		"看一看「沖分」兩個字。",
		"形近字"
	],
	[
		"ch-e-5-t1",
		5,
		"upper",
		"斬碎句子中的錯別字！",
		"這座古蹟見證了百年的歷使",
		11,
		"史",
		"「歷史」的史才對，不是使用的使。",
		"最後一個字有誤。",
		"字音字形"
	],
	[
		"ch-e-5-t2",
		5,
		"lower",
		"斬碎句子中的錯別字！",
		"面對困難時千萬不要輕言放氣",
		12,
		"棄",
		"「放棄」是棄置的棄，不是空氣的氣。",
		"看最後一個字。",
		"形近字"
	],
	[
		"ch-e-6-t1",
		6,
		"upper",
		"斬碎句子中的錯別字！",
		"科學家以嚴謹的態度進行實燕",
		12,
		"驗",
		"「實驗」是馬部的驗，不是燕子的燕。",
		"最後一個字是同音錯字。",
		"字音字形"
	],
	[
		"ch-e-6-t2",
		6,
		"lower",
		"斬碎句子中的錯別字！",
		"全班同心協力終於克復了難關",
		9,
		"服",
		"「克服」是服從的服，不是恢復的復。",
		"注意「克復」二字。",
		"字音字形"
	]
];
var EPIC_CHINESE_QUESTIONS = [
	...buildChineseSlash(CH_SLASH_ROWS),
	...buildChineseRadical(CH_RADICAL_ROWS),
	...buildChineseTypo(CH_TYPO_ROWS)
];
function buildEnglishChoice(rows) {
	return rows.map(([id, grade, semester, mode, prompt, speakText, zhMeaning, choices, correctIndex, explanation, hint, knowledgeTag]) => ({
		id,
		grade,
		semester,
		subject: "english",
		type: mode,
		prompt,
		payload: {
			mode,
			speakText,
			zhMeaning,
			choices,
			correctIndex
		},
		answer: choices[correctIndex],
		explanation,
		hint,
		knowledgeTag
	}));
}
function buildEnglishSpell(rows) {
	return rows.map(([id, grade, semester, prompt, speakText, zhMeaning, targetWord, explanation, hint, knowledgeTag]) => {
		const word = targetWord.toUpperCase();
		return {
			id,
			grade,
			semester,
			subject: "english",
			type: "spell",
			prompt,
			payload: {
				mode: "spell",
				speakText,
				zhMeaning,
				word,
				distractorLetters: [
					"X",
					"Q",
					"Z"
				].filter((c) => !word.includes(c)).slice(0, 2)
			},
			answer: word,
			explanation,
			hint,
			knowledgeTag
		};
	});
}
var EN_CHOICE_ROWS = [
	[
		"en-e-3-1",
		3,
		"upper",
		"listen",
		"聽音辨字：擊落「書包」單字敵機！",
		"Schoolbag",
		"書包",
		[
			"Schoolbag",
			"Pencil",
			"Eraser",
			"Ruler"
		],
		0,
		"Schoolbag 指學生背的書包。",
		"school (學校) + bag (袋子)。",
		"生活單字"
	],
	[
		"en-e-3-2",
		3,
		"upper",
		"listen",
		"聽音辨字：擊落「兔子」單字敵機！",
		"Rabbit",
		"兔子",
		[
			"Rabbit",
			"Tiger",
			"Monkey",
			"Elephant"
		],
		0,
		"Rabbit 是長耳朵的兔子。",
		"以 R 開頭的可愛動物。",
		"生活單字"
	],
	[
		"en-e-3-3",
		3,
		"upper",
		"listen",
		"聽音辨字：擊落「紫色」單字敵機！",
		"Purple",
		"紫色",
		[
			"Purple",
			"Yellow",
			"Orange",
			"Green"
		],
		0,
		"Purple 代表紫色。",
		"葡萄（grape）常見的顏色。",
		"顏色單字"
	],
	[
		"en-e-3-4",
		3,
		"upper",
		"fill",
		"How ___ you? I am fine, thank you.",
		"How are you?",
		"你好嗎？",
		[
			"are",
			"is",
			"am",
			"do"
		],
		0,
		"主詞為 you 時，be 動詞搭配 are。",
		"you 搭配 are。",
		"基礎文法"
	],
	[
		"en-e-3-5",
		3,
		"upper",
		"listen",
		"聽音辨字：擊落「牛奶」單字敵機！",
		"Milk",
		"牛奶",
		[
			"Milk",
			"Juice",
			"Water",
			"Tea"
		],
		0,
		"Milk 是白色營養的牛奶。",
		"M 開頭的飲品。",
		"天氣食物"
	],
	[
		"en-e-3-6",
		3,
		"lower",
		"listen",
		"聽音辨字：擊落「香蕉」單字敵機！",
		"Banana",
		"香蕉",
		[
			"Banana",
			"Apple",
			"Peach",
			"Lemon"
		],
		0,
		"Banana 是黃色彎彎的香蕉。",
		"B 開頭的水果。",
		"天氣食物"
	],
	[
		"en-e-3-7",
		3,
		"lower",
		"fill",
		"What is this? ___ is a blue pen.",
		"It is a blue pen.",
		"這是一支藍筆",
		[
			"It",
			"They",
			"We",
			"You"
		],
		0,
		"回答單數物品 this 時，代名詞用 It。",
		"單數物品用 It。",
		"基礎文法"
	],
	[
		"en-e-3-8",
		3,
		"lower",
		"listen",
		"聽音辨字：擊落「十二」單字敵機！",
		"Twelve",
		"十二",
		[
			"Twelve",
			"Twenty",
			"Two",
			"Ten"
		],
		0,
		"Twelve 代表數字 12。",
		"比 eleven (11) 多 1。",
		"生活單字"
	],
	[
		"en-e-3-9",
		3,
		"lower",
		"listen",
		"聽音辨字：擊落「妹妹／姊姊」單字敵機！",
		"Sister",
		"姊妹",
		[
			"Sister",
			"Brother",
			"Father",
			"Mother"
		],
		0,
		"Sister 指姊姊或妹妹。",
		"S 開頭的家人稱謂。",
		"生活單字"
	],
	[
		"en-e-3-10",
		3,
		"lower",
		"fill",
		"Can you swim? Yes, I ___.",
		"Yes, I can.",
		"是的，我會。",
		[
			"can",
			"am",
			"is",
			"have"
		],
		0,
		"用 Can 問的能力問題，簡答也用 can。",
		"問句開頭是 Can。",
		"生活對話"
	],
	[
		"en-e-4-1",
		4,
		"upper",
		"listen",
		"聽音辨字：擊落「圖書館」單字敵機！",
		"Library",
		"圖書館",
		[
			"Library",
			"Kitchen",
			"Bedroom",
			"Garden"
		],
		0,
		"Library 是可以看書借書的圖書館。",
		"L 開頭的校園地點。",
		"生活單字"
	],
	[
		"en-e-4-2",
		4,
		"upper",
		"listen",
		"聽音辨字：擊落「星期三」單字敵機！",
		"Wednesday",
		"星期三",
		[
			"Wednesday",
			"Tuesday",
			"Thursday",
			"Friday"
		],
		0,
		"Wednesday 代表星期三。",
		"W 開頭的星期名稱。",
		"生活單字"
	],
	[
		"en-e-4-3",
		4,
		"upper",
		"fill",
		"What ___ is it? It is seven thirty.",
		"What time is it?",
		"現在幾點？",
		[
			"time",
			"day",
			"color",
			"name"
		],
		0,
		"詢問時間使用 What time is it?。",
		"回答是七點半（時間）。",
		"疑問詞"
	],
	[
		"en-e-4-4",
		4,
		"upper",
		"listen",
		"聽音辨字：擊落「下雪的」單字敵機！",
		"Snowy",
		"下雪的",
		[
			"Snowy",
			"Sunny",
			"Windy",
			"Hot"
		],
		0,
		"Snowy 形容正在下雪的寒冷天氣。",
		"snow (雪) + y。",
		"天氣食物"
	],
	[
		"en-e-4-5",
		4,
		"upper",
		"fill",
		"Where ___ my shoes? They are under the bed.",
		"Where are my shoes?",
		"我的鞋子在哪？",
		[
			"are",
			"is",
			"am",
			"does"
		],
		0,
		"shoes 是複數名詞，be 動詞必須用 are。",
		"鞋子有兩隻（複數）。",
		"基礎文法"
	],
	[
		"en-e-4-6",
		4,
		"lower",
		"listen",
		"聽音辨字：擊落「三明治」單字敵機！",
		"Sandwich",
		"三明治",
		[
			"Sandwich",
			"Noodles",
			"Salad",
			"Soup"
		],
		0,
		"Sandwich 是兩片吐司夾餡的三明治。",
		"早餐常見的 S 開頭食物。",
		"天氣食物"
	],
	[
		"en-e-4-7",
		4,
		"lower",
		"fill",
		"She is ___ a comic book now.",
		"She is reading a comic book now.",
		"她正在看漫畫",
		[
			"reading",
			"read",
			"reads",
			"to read"
		],
		0,
		"now 代表現在進行式：be 動詞 + V-ing。",
		"看到 now 要加 ing！",
		"時態變化"
	],
	[
		"en-e-4-8",
		4,
		"lower",
		"listen",
		"聽音辨字：擊落「醫院」單字敵機！",
		"Hospital",
		"醫院",
		[
			"Hospital",
			"Supermarket",
			"Park",
			"Station"
		],
		0,
		"Hospital 是醫生看診的醫院。",
		"H 開頭的場所。",
		"生活單字"
	],
	[
		"en-e-4-9",
		4,
		"lower",
		"fill",
		"Do you like apples? Yes, I ___.",
		"Yes, I do.",
		"是的，我喜歡。",
		[
			"do",
			"am",
			"can",
			"does"
		],
		0,
		"用 Do 開頭的問句，肯定簡答為 Yes, I do.。",
		"問句用 Do 問，就用 do 答。",
		"生活對話"
	],
	[
		"en-e-5-1",
		5,
		"upper",
		"listen",
		"聽音辨字：擊落「科學／自然課」敵機！",
		"Science",
		"自然科學",
		[
			"Science",
			"History",
			"Music",
			"Math"
		],
		0,
		"Science 是自然科學科目。",
		"Sc 開頭的學科。",
		"生活單字"
	],
	[
		"en-e-5-2",
		5,
		"upper",
		"fill",
		"How ___ does this backpack cost?",
		"How much does this backpack cost?",
		"這個背包多少錢？",
		[
			"much",
			"many",
			"old",
			"long"
		],
		0,
		"詢問價錢使用 How much。",
		"問金額用 How much。",
		"疑問詞"
	],
	[
		"en-e-5-3",
		5,
		"upper",
		"listen",
		"聽音辨字：擊落「牙痛」單字敵機！",
		"Toothache",
		"牙痛",
		[
			"Toothache",
			"Headache",
			"Fever",
			"Cough"
		],
		0,
		"Tooth (牙齒) + ache (疼痛) = 牙痛。",
		"tooth 是牙齒。",
		"生活單字"
	],
	[
		"en-e-5-4",
		5,
		"upper",
		"fill",
		"My brother ___ basketball every Sunday.",
		"My brother plays basketball every Sunday.",
		"哥哥每週日打籃球",
		[
			"plays",
			"play",
			"playing",
			"played"
		],
		0,
		"主詞 My brother 為第三人稱單數，現在簡單式動詞加 s。",
		"第三人稱單數動詞要加 s。",
		"時態變化"
	],
	[
		"en-e-5-5",
		5,
		"lower",
		"listen",
		"聽音辨字：擊落「博物館」單字敵機！",
		"Museum",
		"博物館",
		[
			"Museum",
			"Theater",
			"Airport",
			"Bakery"
		],
		0,
		"Museum 是展示文物與藝術品的博物館。",
		"M 開頭的展覽場所。",
		"生活單字"
	],
	[
		"en-e-5-6",
		5,
		"lower",
		"fill",
		"There ___ some milk on the table.",
		"There is some milk on the table.",
		"桌上有一些牛奶",
		[
			"is",
			"are",
			"have",
			"has"
		],
		0,
		"milk 是不可數名詞，搭配 There is。",
		"液體不可數，用單數 is。",
		"基礎文法"
	],
	[
		"en-e-5-7",
		5,
		"lower",
		"listen",
		"聽音辨字：擊落「秋天」單字敵機！",
		"Autumn",
		"秋天",
		[
			"Autumn",
			"Spring",
			"Summer",
			"Winter"
		],
		0,
		"Autumn (或 Fall) 代表秋天。",
		"楓葉轉紅的季節。",
		"天氣食物"
	],
	[
		"en-e-5-8",
		5,
		"lower",
		"fill",
		"I want to ___ a pilot in the future.",
		"I want to be a pilot.",
		"我想成為飛行員",
		[
			"be",
			"is",
			"am",
			"being"
		],
		0,
		"want to 後面要接原形動詞 be。",
		"to 後面放原形動詞。",
		"職業興趣"
	],
	[
		"en-e-5-9",
		5,
		"lower",
		"fill",
		"Whose jacket is this? It is ___.",
		"It is mine.",
		"它是我的。",
		[
			"mine",
			"my",
			"me",
			"I"
		],
		0,
		"所有格代名詞 mine = my jacket。",
		"後面沒有名詞，要用所有格代名詞。",
		"基礎文法"
	],
	[
		"en-e-6-1",
		6,
		"upper",
		"fill",
		"We ___ to Taipei Zoo yesterday.",
		"We went to Taipei Zoo yesterday.",
		"我們昨天去了動物園",
		[
			"went",
			"go",
			"going",
			"goes"
		],
		0,
		"yesterday 表示過去式，go 的過去式為不規則變化 went。",
		"yesterday 是昨天，用過去式。",
		"時態變化"
	],
	[
		"en-e-6-2",
		6,
		"upper",
		"listen",
		"聽音辨字：擊落「太空人」單字敵機！",
		"Astronaut",
		"太空人",
		[
			"Astronaut",
			"Scientist",
			"Engineer",
			"Artist"
		],
		0,
		"Astronaut 是搭乘太空船探索宇宙的太空人。",
		"A 開頭的宇宙職業。",
		"職業興趣"
	],
	[
		"en-e-6-3",
		6,
		"upper",
		"fill",
		"Did you ___ your homework last night?",
		"Did you finish your homework last night?",
		"昨晚你完成功課了嗎？",
		[
			"finish",
			"finished",
			"finishing",
			"finishes"
		],
		0,
		"助動詞 Did 後面的動詞必須還原為原形 finish。",
		"看到 Did，後面動詞用原形！",
		"時態變化"
	],
	[
		"en-e-6-4",
		6,
		"upper",
		"listen",
		"聽音辨字：擊落「中秋節」單字敵機！",
		"Moon Festival",
		"中秋節",
		[
			"Moon Festival",
			"Dragon Boat",
			"New Year",
			"Halloween"
		],
		0,
		"Moon Festival 是賞月吃月餅的中秋節。",
		"Moon 是月亮。",
		"節慶文化"
	],
	[
		"en-e-6-5",
		6,
		"upper",
		"fill",
		"Taiwan is famous ___ its night markets.",
		"Taiwan is famous for its night markets.",
		"台灣以夜市聞名",
		[
			"for",
			"at",
			"on",
			"to"
		],
		0,
		"be famous for 是固定片語，意為「以……聞名」。",
		"famous 後常接 for。",
		"閱讀填空"
	],
	[
		"en-e-6-6",
		6,
		"lower",
		"fill",
		"How will you go to Tainan? I will go ___ train.",
		"I will go by train.",
		"我會搭火車去",
		[
			"by",
			"in",
			"on",
			"with"
		],
		0,
		"搭乘交通工具使用介系詞 by + 交通工具（不加冠詞）。",
		"by bus, by MRT, by train。",
		"閱讀填空"
	],
	[
		"en-e-6-7",
		6,
		"lower",
		"listen",
		"聽音辨字：擊落「護照」單字敵機！",
		"Passport",
		"護照",
		[
			"Passport",
			"Ticket",
			"Luggage",
			"Camera"
		],
		0,
		"Passport 是出國通關必備的護照。",
		"Pass + port。",
		"生活單字"
	],
	[
		"en-e-6-8",
		6,
		"lower",
		"fill",
		"She is ___ than her younger brother.",
		"She is taller than her younger brother.",
		"她比弟弟高",
		[
			"taller",
			"tall",
			"tallest",
			"more tall"
		],
		0,
		"句中有 than，單音節形容詞 tall 的比較級為 taller。",
		"看到 than 要用比較級！",
		"基礎文法"
	],
	[
		"en-e-6-9",
		6,
		"lower",
		"listen",
		"聽音辨字：擊落「環保回收」單字敵機！",
		"Recycle",
		"資源回收",
		[
			"Recycle",
			"Rebuild",
			"Repeat",
			"Return"
		],
		0,
		"Recycle 指將紙類、塑膠、金屬分類回收再利用。",
		"綠色環保三大 R 之一。",
		"節慶文化"
	],
	[
		"en-e-6-10",
		6,
		"lower",
		"fill",
		"What are you going to ___ this weekend?",
		"What are you going to do this weekend?",
		"週末你打算做什麼？",
		[
			"do",
			"did",
			"doing",
			"does"
		],
		0,
		"be going to + 原形動詞，表示未來計畫。",
		"to 後面要接原形動詞。",
		"時態變化"
	]
];
var EN_SPELL_ROWS = [
	[
		"en-e-3-s1",
		3,
		"upper",
		"拼字破盾：拼出「蘋果」的英文單字！",
		"Apple",
		"蘋果",
		"APPLE",
		"A-P-P-L-E 是蘋果。",
		"A 開頭，有兩個 P。",
		"高頻拼字"
	],
	[
		"en-e-3-s2",
		3,
		"lower",
		"拼字破盾：拼出「開心的」英文單字！",
		"Happy",
		"開心的",
		"HAPPY",
		"H-A-P-P-Y 代表開心的。",
		"Happy Birthday 的 Happy。",
		"高頻拼字"
	],
	[
		"en-e-4-s1",
		4,
		"upper",
		"拼字破盾：拼出「水」的英文單字！",
		"Water",
		"水",
		"WATER",
		"W-A-T-E-R 是每天必喝的水。",
		"W 開頭，結尾是 er。",
		"高頻拼字"
	],
	[
		"en-e-4-s2",
		4,
		"lower",
		"拼字破盾：拼出「音樂」的英文單字！",
		"Music",
		"音樂",
		"MUSIC",
		"M-U-S-I-C 代表音樂。",
		"M-U 開頭。",
		"高頻拼字"
	],
	[
		"en-e-5-s1",
		5,
		"upper",
		"拼字破盾：拼出「行星」的英文單字！",
		"Planet",
		"行星",
		"PLANET",
		"P-L-A-N-E-T 是繞恆星運行的行星。",
		"Plane + t。",
		"高頻拼字"
	],
	[
		"en-e-5-s2",
		5,
		"lower",
		"拼字破盾：拼出「夏天」的英文單字！",
		"Summer",
		"夏天",
		"SUMMER",
		"S-U-M-M-E-R 代表炎熱的夏天。",
		"中間有兩個 M。",
		"高頻拼字"
	],
	[
		"en-e-6-s1",
		6,
		"upper",
		"拼字破盾：拼出「未來」的英文單字！",
		"Future",
		"未來",
		"FUTURE",
		"F-U-T-U-R-E 意為未來。",
		"F-U 開頭，t-u-r-e 結尾。",
		"高頻拼字"
	],
	[
		"en-e-6-s2",
		6,
		"lower",
		"拼字破盾：拼出「旅行」的英文單字！",
		"Travel",
		"旅行",
		"TRAVEL",
		"T-R-A-V-E-L 代表旅行。",
		"Tr 開頭，el 結尾。",
		"高頻拼字"
	]
];
var EPIC_ENGLISH_QUESTIONS = [...buildEnglishChoice(EN_CHOICE_ROWS), ...buildEnglishSpell(EN_SPELL_ROWS)];
function buildMath(rows) {
	return rows.map(([id, grade, semester, prompt, formulaShield, options, correctIndex, explanation, hint, knowledgeTag]) => {
		return {
			id,
			grade,
			semester,
			subject: "math",
			type: knowledgeTag.includes("面積") || knowledgeTag.includes("周長") || knowledgeTag.includes("角") || knowledgeTag.includes("體積") || knowledgeTag.includes("圓") ? "geometry" : knowledgeTag.includes("分數") || knowledgeTag.includes("小數") || knowledgeTag.includes("比") ? "fraction" : "calc",
			prompt,
			payload: {
				formulaShield,
				options,
				correctIndex
			},
			answer: options[correctIndex],
			explanation,
			hint,
			knowledgeTag
		};
	});
}
var EPIC_MATH_QUESTIONS = buildMath([
	[
		"ma-e-3-1",
		3,
		"upper",
		"365 + 248 = ?",
		"365 + 248",
		[
			"613",
			"603",
			"513",
			"623"
		],
		0,
		"個位 5+8=13 進 1，十位 6+4+1=11 進 1，百位 3+2+1=6，得 613。",
		"別忘了進位兩次！",
		"三位數加法"
	],
	[
		"ma-e-3-2",
		3,
		"upper",
		"800 - 345 = ?",
		"800 - 345",
		[
			"455",
			"465",
			"555",
			"445"
		],
		0,
		"800 - 300 = 500，500 - 45 = 455。",
		"可以先減 300 再減 45。",
		"三位數減法"
	],
	[
		"ma-e-3-3",
		3,
		"upper",
		"24 × 6 = ?",
		"24 × 6",
		[
			"144",
			"124",
			"134",
			"154"
		],
		0,
		"20 × 6 = 120，4 × 6 = 24，120 + 24 = 144。",
		"拆成 20×6 與 4×6 相加。",
		"整數乘法"
	],
	[
		"ma-e-3-4",
		3,
		"upper",
		"56 顆糖果平分給 7 位同學，每人分到幾顆？",
		"56 ÷ 7",
		[
			"8 顆",
			"7 顆",
			"9 顆",
			"6 顆"
		],
		0,
		"七八五十六，56 ÷ 7 = 8 顆。",
		"想想九九乘法 7 的口訣。",
		"整數除法"
	],
	[
		"ma-e-3-5",
		3,
		"upper",
		"正方形邊長 9 公分，周長是多少公分？",
		"9 × 4",
		[
			"36 公分",
			"18 公分",
			"81 公分",
			"27 公分"
		],
		0,
		"正方形四條邊一樣長，周長 = 9 × 4 = 36 公分。",
		"正方形有 4 條相等的邊。",
		"周長計算"
	],
	[
		"ma-e-3-6",
		3,
		"upper",
		"1 公里等於多少公尺？",
		"1 km = ? m",
		[
			"1000 公尺",
			"100 公尺",
			"10 公尺",
			"10000 公尺"
		],
		0,
		"1 公里 (km) = 1000 公尺 (m)。",
		"「千」公尺就是一公里。",
		"長度單位"
	],
	[
		"ma-e-3-7",
		3,
		"lower",
		"3/8 + 4/8 = ?",
		"3/8 + 4/8",
		[
			"7/8",
			"7/16",
			"1/8",
			"8/8"
		],
		0,
		"同分母分數相加，分母不變，分子相加 3+4=7，得 7/8。",
		"分母保持 8，分子相加。",
		"分數運算"
	],
	[
		"ma-e-3-8",
		3,
		"lower",
		"2.4 + 1.5 = ?",
		"2.4 + 1.5",
		[
			"3.9",
			"3.8",
			"4.0",
			"2.9"
		],
		0,
		"小數點對齊：2+1=3，0.4+0.5=0.9，合計 3.9。",
		"整數加整數，十分位加十分位。",
		"小數加減"
	],
	[
		"ma-e-3-9",
		3,
		"lower",
		"電影從下午 2:20 播到 3:50，共播放幾分鐘？",
		"3:50 - 2:20",
		[
			"90 分鐘",
			"70 分鐘",
			"80 分鐘",
			"100 分鐘"
		],
		0,
		"經過 1 小時 30 分鐘 = 60 + 30 = 90 分鐘。",
		"1 小時等於 60 分鐘。",
		"時間換算"
	],
	[
		"ma-e-3-10",
		3,
		"lower",
		"3 公斤 200 公克等於多少公克？",
		"3 kg 200 g",
		[
			"3200 公克",
			"3020 公克",
			"500 公克",
			"320 公克"
		],
		0,
		"1 公斤 = 1000 公克，3000 + 200 = 3200 公克。",
		"1 公斤是 1000 公克。",
		"重量換算"
	],
	[
		"ma-e-3-11",
		3,
		"lower",
		"73 ÷ 8 的餘數是多少？",
		"73 ÷ 8 = 9...?",
		[
			"1",
			"2",
			"3",
			"5"
		],
		0,
		"8 × 9 = 72，73 - 72 = 1，餘數為 1。",
		"8 乘以 9 是 72。",
		"有餘數除法"
	],
	[
		"ma-e-3-12",
		3,
		"lower",
		"一個圓的半徑是 6 公分，直徑是多少公分？",
		"d = 6 × 2",
		[
			"12 公分",
			"3 公分",
			"18 公分",
			"36 公分"
		],
		0,
		"直徑是半徑的 2 倍，6 × 2 = 12 公分。",
		"直徑 = 半徑 × 2。",
		"圓的認識"
	],
	[
		"ma-e-4-1",
		4,
		"upper",
		"35 × 20 = ?",
		"35 × 20",
		[
			"700",
			"600",
			"750",
			"350"
		],
		0,
		"先算 35 × 2 = 70，再補一個 0 得 700。",
		"先乘 2 再乘 10。",
		"整數乘除"
	],
	[
		"ma-e-4-2",
		4,
		"upper",
		"平角是幾度？",
		"平角角度",
		[
			"180°",
			"90°",
			"360°",
			"45°"
		],
		0,
		"一直線形成的平角為 180 度，直角是 90 度，周角是 360 度。",
		"兩個直角合起來就是平角。",
		"角度測量"
	],
	[
		"ma-e-4-3",
		4,
		"upper",
		"480 ÷ 16 = ?",
		"480 ÷ 16",
		[
			"30",
			"20",
			"40",
			"25"
		],
		0,
		"16 × 3 = 48，所以 480 ÷ 16 = 30。",
		"先看 48 除以 16。",
		"整數乘除"
	],
	[
		"ma-e-4-4",
		4,
		"upper",
		"120 - (35 + 25) = ?",
		"120 - (35+25)",
		[
			"60",
			"110",
			"70",
			"50"
		],
		0,
		"括號優先：35 + 25 = 60，再算 120 - 60 = 60。",
		"先算括號裡面！",
		"括號順序"
	],
	[
		"ma-e-4-5",
		4,
		"upper",
		"長 15 公分、寬 8 公分的長方形，面積是多少平方公分？",
		"15 × 8",
		[
			"120 平方公分",
			"46 平方公分",
			"110 平方公分",
			"130 平方公分"
		],
		0,
		"長方形面積 = 長 × 寬 = 15 × 8 = 120 平方公分。",
		"長乘以寬。",
		"面積周長"
	],
	[
		"ma-e-4-6",
		4,
		"upper",
		"假分數 17/5 化成帶分數是多少？",
		"17/5 = ?",
		[
			"3 又 2/5",
			"2 又 7/5",
			"3 又 1/5",
			"4 又 2/5"
		],
		0,
		"17 ÷ 5 = 3 餘 2，寫成帶分數 3 又 2/5。",
		"17 除以 5 商是 3，餘數是 2。",
		"分數運算"
	],
	[
		"ma-e-4-7",
		4,
		"lower",
		"0.75 + 0.45 = ?",
		"0.75 + 0.45",
		[
			"1.2",
			"1.1",
			"1.25",
			"0.95"
		],
		0,
		"75 個 0.01 加 45 個 0.01 等於 120 個 0.01，即 1.2。",
		"0.75 + 0.25 = 1，再加 0.2。",
		"小數加減"
	],
	[
		"ma-e-4-8",
		4,
		"lower",
		"5 公升 40 毫升等於多少毫升？",
		"5 L 40 mL",
		[
			"5040 毫升",
			"5400 毫升",
			"540 毫升",
			"5004 毫升"
		],
		0,
		"1 公升 = 1000 毫升，5000 + 40 = 5040 毫升。",
		"十位數是 4，百位數記得補 0。",
		"容量換算"
	],
	[
		"ma-e-4-9",
		4,
		"lower",
		"等腰三角形的頂角是 40°，每個底角是幾度？",
		"(180-40) ÷ 2",
		[
			"70°",
			"60°",
			"80°",
			"50°"
		],
		0,
		"三角形內角和 180°，兩底角和 140°，各為 140 ÷ 2 = 70°。",
		"180 減 40 再平分給兩個底角。",
		"三角形角度"
	],
	[
		"ma-e-4-10",
		4,
		"lower",
		"64 × 25 用巧算最快怎麼算？",
		"16 × (4×25)",
		[
			"1600",
			"1500",
			"1400",
			"1800"
		],
		0,
		"將 64 拆為 16 × 4，先算 4 × 25 = 100，16 × 100 = 1600。",
		"4 × 25 = 100 最好算！",
		"估算心算"
	],
	[
		"ma-e-4-11",
		4,
		"lower",
		"3.6 公里等於多少公尺？",
		"3.6 km = ? m",
		[
			"3600 公尺",
			"360 公尺",
			"3060 公尺",
			"36000 公尺"
		],
		0,
		"3.6 × 1000 = 3600 公尺。",
		"小數點向右移三位。",
		"長度單位"
	],
	[
		"ma-e-5-1",
		5,
		"upper",
		"18 和 24 的最大公因數是多少？",
		"gcd(18, 24)",
		[
			"6",
			"3",
			"12",
			"8"
		],
		0,
		"18 和 24 的公因數有 1, 2, 3, 6，最大為 6。",
		"兩數都能被 6 整除且商互質 (3 和 4)。",
		"因數倍數"
	],
	[
		"ma-e-5-2",
		5,
		"upper",
		"6 和 8 的最小公倍數是多少？",
		"lcm(6, 8)",
		[
			"24",
			"48",
			"12",
			"18"
		],
		0,
		"6 的倍數：6,12,18,24；8 的倍數：8,16,24，最小公倍數是 24。",
		"找第一個同時出現在兩數倍數的數。",
		"因數倍數"
	],
	[
		"ma-e-5-3",
		5,
		"upper",
		"1/3 + 1/4 = ?",
		"1/3 + 1/4",
		[
			"7/12",
			"2/7",
			"5/12",
			"1/7"
		],
		0,
		"通分為分母 12：4/12 + 3/12 = 7/12。",
		"先找 3 和 4 的公倍數 12。",
		"分數運算"
	],
	[
		"ma-e-5-4",
		5,
		"upper",
		"底 14 公分、高 9 公分的三角形面積是？",
		"14 × 9 ÷ 2",
		[
			"63 平方公分",
			"126 平方公分",
			"46 平方公分",
			"72 平方公分"
		],
		0,
		"三角形面積 = 底 × 高 ÷ 2 = 14 × 9 ÷ 2 = 63。",
		"別忘了除以 2！",
		"面積周長"
	],
	[
		"ma-e-5-5",
		5,
		"upper",
		"梯形上底 6cm、下底 10cm、高 5cm，面積為？",
		"(6+10)×5÷2",
		[
			"40 平方公分",
			"80 平方公分",
			"30 平方公分",
			"50 平方公分"
		],
		0,
		"梯形面積 = (上底 + 下底) × 高 ÷ 2 = 16 × 5 ÷ 2 = 40。",
		"上底加下底乘高除以二。",
		"面積周長"
	],
	[
		"ma-e-5-6",
		5,
		"lower",
		"0.6 × 0.8 = ?",
		"0.6 × 0.8",
		[
			"0.48",
			"4.8",
			"0.048",
			"1.4"
		],
		0,
		"6 × 8 = 48，兩數各有 1 位小數，積有 2 位小數，得 0.48。",
		"小數位數共 2 位。",
		"小數乘除"
	],
	[
		"ma-e-5-7",
		5,
		"lower",
		"長 5cm、寬 4cm、高 3cm 的長方體體積是？",
		"5 × 4 × 3",
		[
			"60 立方公分",
			"47 立方公分",
			"94 立方公分",
			"20 立方公分"
		],
		0,
		"長方體體積 = 長 × 寬 × 高 = 5 × 4 × 3 = 60 立方公分。",
		"長寬高三個數相乘。",
		"體積與容積"
	],
	[
		"ma-e-5-8",
		5,
		"lower",
		"衣服原價 500 元打八折，特價多少元？",
		"500 × 80%",
		[
			"400 元",
			"420 元",
			"380 元",
			"450 元"
		],
		0,
		"八折即 80%（0.8），500 × 0.8 = 400 元。",
		"八折就是乘以 0.8。",
		"百分率"
	],
	[
		"ma-e-5-9",
		5,
		"lower",
		"若 x + 18 = 45，則 x = ?",
		"x + 18 = 45",
		[
			"27",
			"23",
			"37",
			"63"
		],
		0,
		"等量減法：x = 45 - 18 = 27。",
		"45 減去 18。",
		"未知數"
	],
	[
		"ma-e-5-10",
		5,
		"lower",
		"3/5 × 15 = ?",
		"3/5 × 15",
		[
			"9",
			"10",
			"6",
			"12"
		],
		0,
		"15 和分母 5 約分成 3，3 × 3 = 9。",
		"先約分更好算！",
		"分數運算"
	],
	[
		"ma-e-5-11",
		5,
		"lower",
		"1 立方公尺等於多少公升？",
		"1 m³ = ? L",
		[
			"1000 公升",
			"100 公升",
			"10 公升",
			"10000 公升"
		],
		0,
		"1 立方公尺 = 1000000 立方公分 = 1000 公升。",
		"也是 1 度水的容量。",
		"體積與容積"
	],
	[
		"ma-e-6-1",
		6,
		"upper",
		"下列哪一個數是「質數」？",
		"找出質數",
		[
			"29",
			"27",
			"33",
			"39"
		],
		0,
		"29 的因數只有 1 和 29；27=3×9、33=3×11、39=3×13 皆為合數。",
		"看看哪個數不能被 3 整除。",
		"質數與質因數"
	],
	[
		"ma-e-6-2",
		6,
		"upper",
		"36 的質因數分解是？",
		"36 = ?",
		[
			"2 × 2 × 3 × 3",
			"4 × 9",
			"2 × 3 × 6",
			"2 × 2 × 2 × 3"
		],
		0,
		"36 = 4 × 9 = 2 × 2 × 3 × 3，全為質數連乘。",
		"每個因數都必須是質數。",
		"質數與質因數"
	],
	[
		"ma-e-6-3",
		6,
		"upper",
		"3/4 ÷ 1/8 = ?",
		"3/4 ÷ 1/8",
		[
			"6",
			"3/32",
			"8",
			"4"
		],
		0,
		"除以分數等於乘以倒數：3/4 × 8/1 = 6。",
		"顛倒相乘：3/4 × 8。",
		"分數運算"
	],
	[
		"ma-e-6-4",
		6,
		"upper",
		"12 : 18 化成最簡整數比是？",
		"12 : 18",
		[
			"2 : 3",
			"3 : 4",
			"4 : 6",
			"1 : 2"
		],
		0,
		"前後項同除以最大公因數 6，得 2 : 3。",
		"同除以 6。",
		"比與比值"
	],
	[
		"ma-e-6-5",
		6,
		"upper",
		"圓半徑 10 公分，圓面積約為？（圓周率取 3.14）",
		"10×10×3.14",
		[
			"314 平方公分",
			"62.8 平方公分",
			"31.4 平方公分",
			"628 平方公分"
		],
		0,
		"圓面積 = 半徑 × 半徑 × 3.14 = 100 × 3.14 = 314。",
		"半徑平方乘 3.14。",
		"圓面積"
	],
	[
		"ma-e-6-6",
		6,
		"upper",
		"高鐵時速 240 公里，行駛 1.5 小時共走了幾公里？",
		"240 × 1.5",
		[
			"360 公里",
			"320 公里",
			"300 公里",
			"400 公里"
		],
		0,
		"距離 = 速率 × 時間 = 240 × 1.5 = 360 公里。",
		"1 小時 240，半小時 120。",
		"速率問題"
	],
	[
		"ma-e-6-7",
		6,
		"lower",
		"小美跑 400 公尺花了 80 秒，她的秒速是多少？",
		"400 ÷ 80",
		[
			"5 公尺/秒",
			"4 公尺/秒",
			"6 公尺/秒",
			"8 公尺/秒"
		],
		0,
		"速率 = 距離 ÷ 時間 = 400 ÷ 80 = 5 公尺/秒。",
		"距離除以時間。",
		"速率問題"
	],
	[
		"ma-e-6-8",
		6,
		"lower",
		"比例尺 1 : 50000 的地圖上 2 公分，實際距離幾公里？",
		"2 × 50000 cm",
		[
			"1 公里",
			"10 公里",
			"5 公里",
			"0.5 公里"
		],
		0,
		"2 × 50000 = 100000 公分 = 1000 公尺 = 1 公里。",
		"1 公里 = 100000 公分。",
		"縮圖與比例尺"
	],
	[
		"ma-e-6-9",
		6,
		"lower",
		"底面積 25 平方公分、高 12 公分的圓柱體積是？",
		"25 × 12",
		[
			"300 立方公分",
			"250 立方公分",
			"150 立方公分",
			"370 立方公分"
		],
		0,
		"柱體體積 = 底面積 × 柱高 = 25 × 12 = 300 立方公分。",
		"底面積乘以高。",
		"柱體體積"
	],
	[
		"ma-e-6-10",
		6,
		"lower",
		"雞兔同籠共 10 頭、28 隻腳，請問兔子有幾隻？",
		"(28 - 20) ÷ 2",
		[
			"4 隻",
			"6 隻",
			"5 隻",
			"3 隻"
		],
		0,
		"假設全是雞有 20 隻腳，多出 8 隻腳，每隻兔多 2 隻腳，故 8÷2=4 隻兔。",
		"多出來的腳數除以 2。",
		"基準量與雞兔同籠"
	],
	[
		"ma-e-6-11",
		6,
		"lower",
		"3x - 7 = 20，請問 x = ?",
		"3x - 7 = 20",
		[
			"9",
			"7",
			"8",
			"10"
		],
		0,
		"3x = 20 + 7 = 27，x = 27 ÷ 3 = 9。",
		"先加 7 再除以 3。",
		"未知數"
	],
	[
		"ma-e-6-12",
		6,
		"lower",
		"扇形圓心角 90°、半徑 4 公分，面積約是？",
		"4×4×3.14×1/4",
		[
			"12.56 平方公分",
			"50.24 平方公分",
			"25.12 平方公分",
			"6.28 平方公分"
		],
		0,
		"90° 佔圓的 1/4，面積 = 16 × 3.14 ÷ 4 = 12.56。",
		"90° 是四分之一個圓！",
		"圓面積"
	]
]);
function buildScience(rows) {
	return rows.map(([id, grade, semester, dishName, orderRequirement, c1, c2, w1, w1r, w2, w2r, targetTempZone, targetTempLabel, targetPh, targetPhLabel, effectStyle, explanation, hint, knowledgeTag]) => ({
		id,
		grade,
		semester,
		subject: "science",
		type: "dish",
		prompt: `製作「${dishName}」：${orderRequirement}`,
		payload: {
			dishName,
			orderRequirement,
			neededCount: 2,
			ingredients: [
				{
					id: `${id}-1`,
					name: c1,
					categoryTag: knowledgeTag,
					color: "#38BDF8",
					accent: "#BAE6FD",
					isCorrect: true
				},
				{
					id: `${id}-2`,
					name: c2,
					categoryTag: knowledgeTag,
					color: "#34D399",
					accent: "#A7F3D0",
					isCorrect: true
				},
				{
					id: `${id}-3`,
					name: w1,
					categoryTag: knowledgeTag,
					color: "#F59E0B",
					accent: "#FDE68A",
					isCorrect: false,
					wrongReason: w1r
				},
				{
					id: `${id}-4`,
					name: w2,
					categoryTag: knowledgeTag,
					color: "#F43F5E",
					accent: "#FECDD3",
					isCorrect: false,
					wrongReason: w2r
				}
			],
			targetTempZone,
			targetTempLabel,
			targetPh,
			targetPhLabel,
			effectStyle: effectStyle === "electric" ? "rainbow" : effectStyle
		},
		answer: `${c1}＋${c2}`,
		explanation,
		hint,
		knowledgeTag
	}));
}
var EPIC_SCIENCE_QUESTIONS = buildScience([
	[
		"sc-e-3-1",
		3,
		"upper",
		"根莖蔬果鮮湯",
		"選出屬於植物「根部」食用的 2 項食材！",
		"紅蘿蔔",
		"地瓜",
		"高麗菜葉",
		"高麗菜主要食用部位是葉子喔！",
		"番茄果實",
		"番茄屬於果實不是根部！",
		"boil",
		"100°C 滾沸鮮湯",
		"neutral",
		"中性清湯",
		"nature",
		"紅蘿蔔與地瓜屬於儲藏養分的塊根，高麗菜是葉，番茄是果實。",
		"想想長在土裡的主根或塊根！",
		"植物構造"
	],
	[
		"sc-e-3-2",
		3,
		"upper",
		"磁力吸星拼盤",
		"選出會被磁鐵強力吸引的 2 種金屬材料！",
		"迴紋針（鐵）",
		"鐵釘",
		"鋁罐拉環",
		"鋁不會被一般磁鐵吸引！",
		"塑膠尺",
		"塑膠是非磁性材料！",
		"simmer",
		"55°C 溫控磁爐",
		"neutral",
		"中性檢驗",
		"electric",
		"磁鐵主要吸引鐵、鈷、鎳等磁性金屬，鋁和塑膠不會被吸起。",
		"找含鐵的物品。",
		"磁鐵性質"
	],
	[
		"sc-e-3-3",
		3,
		"upper",
		"空氣氣球舒芙蕾",
		"選出能證明「空氣佔空間且有壓力」的 2 項現象！",
		"鼓起的氣球",
		"按壓針筒回彈",
		"沉底石頭",
		"石頭是固體，不代表空氣體積！",
		"固體冰塊",
		"冰塊是固態水。",
		"simmer",
		"55°C 膨脹烘烤",
		"neutral",
		"中性氣壓",
		"rainbow",
		"空氣雖然看不見，但會佔據空間，壓縮時還會產生回彈力量。",
		"想想吹氣球與壓針筒的感覺。",
		"空氣與風"
	],
	[
		"sc-e-3-4",
		3,
		"upper",
		"速溶晶瑩糖水",
		"選出能「完全溶解在水中」的 2 種廚房食材！",
		"細砂糖",
		"精製食鹽",
		"黑胡椒粒",
		"黑胡椒粒會浮沉，不會真正溶解！",
		"食用沙拉油",
		"油與水會分層不相溶！",
		"boil",
		"100°C 熱水加速溶解",
		"neutral",
		"中性糖水",
		"rainbow",
		"糖和鹽會均勻分散在水中形成透明水溶液；胡椒粉和油不會溶解。",
		"攪拌後會完全看不見顆粒的是？",
		"溶解實驗"
	],
	[
		"sc-e-3-5",
		3,
		"upper",
		"冰霜三態刨冰",
		"選出屬於「固態與氣態」水變化名稱！",
		"冰塊（固態）",
		"水蒸氣（氣態）",
		"乾燥沙粒",
		"沙粒不是水的三態！",
		"鐵塊",
		"鐵塊屬於金屬。",
		"freeze",
		"0°C 冰點凝固",
		"neutral",
		"中性純水",
		"ice",
		"水在 0°C 以下凝結成固態冰，受熱蒸發或沸騰成為氣態水蒸氣。",
		"水的三態：冰、水、水蒸氣。",
		"水的三態"
	],
	[
		"sc-e-3-6",
		3,
		"upper",
		"廚房變色試紙凍",
		"選出味道偏酸、屬於「酸性」的 2 種食材！",
		"新鮮檸檬汁",
		"烏醋",
		"小蘇打水",
		"小蘇打水是鹼性的！",
		"純淨開水",
		"純水是中性的！",
		"simmer",
		"55°C 溫熱萃取",
		"acid",
		"酸性檸檬紅",
		"rainbow",
		"檸檬汁與食醋含有機酸，屬於酸性水溶液。",
		"喝起來酸酸的食物。",
		"水溶液酸鹼"
	],
	[
		"sc-e-3-7",
		3,
		"lower",
		"種菜苗能量沙拉",
		"選出種子發芽最需要的 2 大自然條件！",
		"適當水分",
		"空氣與適溫",
		"完全黑暗冷凍",
		"冷凍會讓種子無法發芽！",
		"濃鹽水浸泡",
		"濃鹽水會害種子脫水無法萌芽！",
		"simmer",
		"55°C 溫暖萌芽",
		"neutral",
		"中性澆灌",
		"nature",
		"大多數種子發芽需要充足的水分、空氣與適宜溫度。",
		"種綠豆時每天要保持棉花濕潤。",
		"植物種植"
	],
	[
		"sc-e-3-8",
		3,
		"lower",
		"昆蟲特徵造型餅",
		"選出符合「昆蟲身體構造」的 2 項特徵！",
		"六隻腳",
		"頭胸腹三部分",
		"八隻腳",
		"八隻腳的是蜘蛛，不是昆蟲！",
		"沒有觸角有鱗片",
		"那是魚類或爬蟲類的特徵！",
		"simmer",
		"55°C 餅乾烘焙",
		"neutral",
		"中性麵糰",
		"nature",
		"昆蟲都具備頭、胸、腹三節與六隻腳，多數有觸角和翅膀。",
		"想想蝴蝶和獨角仙有幾隻腳。",
		"動物分類"
	],
	[
		"sc-e-3-9",
		3,
		"lower",
		"浮力小船濃湯",
		"選出通常會「浮在水面上」的 2 種材料！",
		"保麗龍塊",
		"軟木塞",
		"實心鐵球",
		"實心鐵球密度比水大，會沉下去！",
		"玻璃彈珠",
		"彈珠比水重，會直接沉底！",
		"simmer",
		"55°C 平穩水面",
		"neutral",
		"中性清水",
		"ice",
		"密度小於水的保麗龍與軟木塞能輕鬆浮在水面上。",
		"想想救生圈或木頭的材質。",
		"浮力與材質"
	],
	[
		"sc-e-3-10",
		3,
		"lower",
		"溫度計冰火雙重奏",
		"選出正確使用「酒精溫度計」的 2 個步驟！",
		"視線與液面平視",
		"液囊不碰杯底",
		"直接攪拌湯鍋",
		"溫度計玻璃很脆，不能拿來攪拌！",
		"拿起來離開水再讀",
		"離開液體後溫度會立刻改變！",
		"boil",
		"100°C 沸點觀測",
		"neutral",
		"中性量測",
		"fire",
		"測量液溫時溫度計液囊應完全浸入水中不碰杯壁，且平視刻度讀數。",
		"量體溫或水溫要平視刻度喔！",
		"溫度測量"
	],
	[
		"sc-e-3-11",
		3,
		"lower",
		"風力轉轉泡芙",
		"選出屬於「自然風力應用」的 2 項生活裝置！",
		"風力發電機",
		"帆船風帆",
		"微波爐加熱",
		"微波爐是靠電磁波加熱，不是風力！",
		"電池手電筒",
		"手電筒是靠電池化學能！",
		"simmer",
		"55°C 微風烘烤",
		"neutral",
		"中性氣流",
		"electric",
		"流動的空氣就是風，能推動帆船與風力發電葉片。",
		"找靠風吹動的設施。",
		"空氣與風"
	],
	[
		"sc-e-3-12",
		3,
		"lower",
		"雨天雲朵棉花糖",
		"選出與「天氣觀測」直接相關的 2 種儀器！",
		"雨量筒",
		"風向風速計",
		"放大鏡",
		"放大鏡是用來觀察微小物體的！",
		"音叉",
		"音叉是研究聲音震動的器材！",
		"freeze",
		"0°C 高空冰晶",
		"neutral",
		"中性水氣",
		"ice",
		"氣象觀測常用雨量筒量測降雨毫米數，並以風向計判斷風向。",
		"氣象局怎麼知道下了多少雨？",
		"天氣觀測"
	],
	[
		"sc-e-4-1",
		4,
		"upper",
		"月亮盈虧月餅",
		"選出關於「月相變化」的 2 項正確觀念！",
		"農曆十五滿月",
		"月亮反射太陽光",
		"月亮自己會發光",
		"月亮本身不發光，是反射太陽光！",
		"每天形狀完全相同",
		"月相會隨農曆日期週期改變！",
		"simmer",
		"55°C 慢火烤餅",
		"neutral",
		"中性內餡",
		"rainbow",
		"月球靠反射太陽光發亮，每逢農曆初一為朔、十五為滿月。",
		"想想中秋節是農曆幾號？",
		"天文月相"
	],
	[
		"sc-e-4-2",
		4,
		"upper",
		"水生植物翠玉羹",
		"選出屬於「漂浮性水生植物」的 2 種植物！",
		"布袋蓮",
		"浮萍",
		"仙人掌",
		"仙人掌是乾燥沙漠植物！",
		"榕樹",
		"榕樹是陸生喬木！",
		"simmer",
		"55°C 清煮蔬羹",
		"neutral",
		"中性池水",
		"nature",
		"布袋蓮葉柄膨大含氣室、浮萍體小輕盈，皆可漂浮在水面。",
		"找整株漂在水上的植物。",
		"水域生態"
	],
	[
		"sc-e-4-3",
		4,
		"upper",
		"光影萬花筒果凍",
		"選出光的「直線前進與反射」的 2 項例子！",
		"鏡子照出影像",
		"樹蔭下的影子",
		"金屬受熱變長",
		"那是熱脹冷縮，不是光學現象！",
		"磁鐵相斥",
		"那是磁力現象！",
		"freeze",
		"0°C 透亮定型",
		"neutral",
		"中性明膠",
		"rainbow",
		"光沿直線傳播遇到不透明物會形成影子，遇光滑鏡面會發生反射。",
		"照鏡子與立竿見影都和光有關。",
		"光的現象"
	],
	[
		"sc-e-4-4",
		4,
		"upper",
		"串並聯燈泡舒芙蕾",
		"選出能讓小燈泡「順利發亮」的 2 項必要條件！",
		"形成完整通路",
		"連接電池正負極",
		"只接電池正極",
		"沒有回到負極無法形成電流通路！",
		"串接橡皮擦",
		"橡皮擦是絕緣體會阻斷電流！",
		"simmer",
		"55°C 通電溫熱",
		"neutral",
		"中性電路",
		"electric",
		"電流必須從電池正極經導體流過燈泡再回負極，形成封閉通路才亮。",
		"斷路或絕緣體會讓燈泡不亮。",
		"電路與磁鐵"
	],
	[
		"sc-e-4-5",
		4,
		"upper",
		"毛細現象彩虹飲",
		"選出生活中「毛細現象」的 2 項實例！",
		"衛生紙吸乾水漬",
		"抹布吸水上升",
		"冰塊在杯中融化",
		"冰塊融化是狀態變化！",
		"鐵塊沉入水底",
		"那是浮力與密度現象！",
		"freeze",
		"0°C 漸層冰飲",
		"acid",
		"酸性漸層紅",
		"rainbow",
		"細小縫隙會讓水克服重力向上攀升，如衛生紙、抹布與植物維管束。",
		"水沿著細小纖維往上爬的現象。",
		"水的現象"
	],
	[
		"sc-e-4-6",
		4,
		"upper",
		"虹吸噴泉氣泡飲",
		"選出產生「虹吸現象」的 2 個必要條件！",
		"水管裝滿水無氣泡",
		"出水口低於進水口",
		"水管兩端一樣高",
		"兩端等高時水不會持續流出！",
		"管內必須充滿空氣",
		"有大量空氣會中斷虹吸！",
		"freeze",
		"0°C 冰涼噴泉",
		"neutral",
		"中性湧泉",
		"ice",
		"將裝滿水的軟管一端置於高處水面、另一端放低於水面，水就會自動流下。",
		"幫魚缸換水時出水口要比魚缸低！",
		"水的現象"
	],
	[
		"sc-e-4-7",
		4,
		"lower",
		"昆蟲完全變態派",
		"選出屬於「完全變態（卵→幼蟲→蛹→成蟲）」的 2 種昆蟲！",
		"紋白蝶",
		"獨角仙",
		"蝗蟲",
		"蝗蟲沒有蛹期，屬於不完全變態！",
		"蜻蜓",
		"蜻蜓沒有蛹期！",
		"simmer",
		"55°C 金黃烘烤",
		"neutral",
		"中性派皮",
		"nature",
		"蝴蝶、甲蟲、蚊蠅等一生經歷卵、幼蟲、蛹、成蟲四階段，稱完全變態。",
		"想想毛毛蟲結蛹變蝴蝶！",
		"昆蟲生長"
	],
	[
		"sc-e-4-8",
		4,
		"lower",
		"交通工具動力燉飯",
		"選出較環保、減少廢氣排放的 2 種交通動力！",
		"太陽能電力",
		"人力腳踏車",
		"燃燒重油引擎",
		"重油會排放大量廢氣與二氧化碳！",
		"老舊二行程機車",
		"會產生大量黑煙污染空氣！",
		"boil",
		"100°C 綠能快煮",
		"neutral",
		"中性低碳",
		"electric",
		"電動車、太陽能與腳踏車能大幅降低空氣污染與碳排放。",
		"找零排氣的交通方式。",
		"能源與交通"
	],
	[
		"sc-e-4-9",
		4,
		"lower",
		"彩虹酸鹼紫高麗菜湯",
		"選出滴入「紫色高麗菜汁」會變藍綠色的 2 種鹼性液體！",
		"小蘇打水",
		"肥皂水",
		"檸檬汁",
		"檸檬汁是酸性的，會變偏紅色！",
		"白醋",
		"白醋是酸性的，會變桃紅色！",
		"boil",
		"100°C 煮出花青素",
		"alkali",
		"鹼性藍綠變色",
		"rainbow",
		"紫色高麗菜汁遇酸變紅、中性維持紫色、遇鹼性小蘇打或肥皂水變藍綠。",
		"找具去油污能力的鹼性清潔液。",
		"水溶液酸鹼"
	],
	[
		"sc-e-4-10",
		4,
		"lower",
		"連通管水平麵",
		"選出應用「連通管原理」的 2 種生活用品！",
		"茶壺壺嘴與壺身",
		"洗手台 U 型存水彎",
		"磁浮列車",
		"磁浮列車是運用磁極排斥力！",
		"放大鏡聚光",
		"放大鏡是運用凸透鏡折射！",
		"boil",
		"100°C 水平煮麵",
		"neutral",
		"中性湯底",
		"ice",
		"底部相通的容器裝入同種液體靜止時，各管液面高度會維持在同一水平面。",
		"倒水時茶壺嘴不能比壺身矮喔！",
		"水的現象"
	],
	[
		"sc-e-4-11",
		4,
		"lower",
		"地震防災百寶盒",
		"選出地震發生時「保命三步驟」中的 2 項正確動作！",
		"趴下掩護穩住",
		"遠離玻璃書櫃",
		"立刻搭乘電梯逃生",
		"地震時絕對不可搭電梯，以免受困！",
		"衝進廚房開瓦斯",
		"應關閉火源，絕不可點火！",
		"simmer",
		"55°C 安全避難",
		"neutral",
		"中性演練",
		"fire",
		"地震來襲優先「趴下、掩護、穩住」，保護頭頸並遠離掉落物，勿搭電梯。",
		"記住 DCH 防震口訣！",
		"防災科學"
	],
	[
		"sc-e-4-12",
		4,
		"lower",
		"導電快炒鐵板燒",
		"選出屬於「電的良好導體」的 2 種材料！",
		"銅線",
		"鐵湯匙",
		"木頭筷子",
		"乾燥木材是絕緣體不導電！",
		"玻璃杯",
		"玻璃是絕緣體！",
		"boil",
		"100°C 高溫快炒",
		"neutral",
		"中性安全",
		"electric",
		"銅、鐵、鋁等金屬自由電子多，屬於良導體；木頭與玻璃為絕緣體。",
		"電線裡面包的是哪種金屬？",
		"導體與絕緣體"
	],
	[
		"sc-e-5-1",
		5,
		"upper",
		"太陽軌跡日晷鬆餅",
		"選出台灣夏季與冬季「太陽升落」的 2 項正確現象！",
		"正午太陽影長最短",
		"夏至晝長夜短",
		"太陽從西邊升起",
		"太陽永遠從偏東方升起、偏西方落下！",
		"冬至太陽比夏至高",
		"冬至太陽仰角最低、影子最長！",
		"simmer",
		"55°C 陽光焦糖",
		"neutral",
		"中性鬆餅",
		"fire",
		"一天中正午太陽仰角最高、影長最短；台灣夏至白晝最長。",
		"中午 12 點時影子幾乎在腳下最短。",
		"太陽與影長"
	],
	[
		"sc-e-5-2",
		5,
		"upper",
		"植物維管束能量飲",
		"選出植物「根、莖、葉」分工合作的 2 項正確敘述！",
		"根吸收水分礦物質",
		"葉氣孔行蒸散作用",
		"花瓣負責吸收地下水",
		"花瓣主要是吸引昆蟲授粉！",
		"樹皮製造所有陽光",
		"行光合作用主要是含葉綠體的葉片！",
		"simmer",
		"55°C 溫和萃取",
		"neutral",
		"中性植物汁",
		"nature",
		"根吸收水與礦物質，經莖內維管束向上輸送，葉片氣孔蒸散水分產生拉力。",
		"想想澆水都澆在土裡讓誰吸收？",
		"植物構造"
	],
	[
		"sc-e-5-3",
		5,
		"upper",
		"燃燒三要素炭烤串",
		"選出「火能夠持續燃燒」必備的 2 項核心條件！",
		"氧氣（助燃物）",
		"達到燃點溫度",
		"大量二氧化碳",
		"二氧化碳不助燃，常用來滅火！",
		"完全隔絕空氣",
		"隔絕空氣會立刻熄火！",
		"boil",
		"100°C 烈火炭烤",
		"neutral",
		"中性炭火",
		"fire",
		"燃燒三要素：可燃物、助燃物（氧氣）與達到燃點溫度，缺一不可。",
		"用鍋蓋蓋住油鍋就是切斷氧氣！",
		"空氣與燃燒"
	],
	[
		"sc-e-5-4",
		5,
		"upper",
		"雙氧水氧氣泡泡湯",
		"選出實驗室「製造氧氣」常用的 2 種材料！",
		"雙氧水",
		"紅蘿蔔丁（催化）",
		"小蘇打加醋",
		"小蘇打加醋產生的是二氧化碳！",
		"食鹽加清水",
		"食鹽溶於水不會產生氧氣！",
		"simmer",
		"55°C 溫和冒泡",
		"neutral",
		"中性催化",
		"rainbow",
		"雙氧水加入含過氧化氫酶的紅蘿蔔或二氧化錳，可迅速分解出氧氣。",
		"雙氧水消毒傷口時冒出的就是氧氣泡！",
		"空氣與燃燒"
	],
	[
		"sc-e-5-5",
		5,
		"upper",
		"滅火二氧化碳氣泡飲",
		"選出「二氧化碳」的 2 項獨特性質！",
		"使澄清石灰水變混濁",
		"不助燃可滅火",
		"會讓線香燒得更旺",
		"讓線香更旺的是氧氣！",
		"比空氣輕會直飛太空",
		"二氧化碳比空氣重，會向下沉！",
		"freeze",
		"0°C 冰鎮氣泡",
		"acid",
		"微酸性碳酸",
		"ice",
		"二氧化碳無色無味、比空氣重、不助燃，能讓澄清石灰水變白混濁。",
		"汽水裡的氣泡就是二氧化碳喔！",
		"空氣與燃燒"
	],
	[
		"sc-e-5-6",
		5,
		"lower",
		"星空北斗七星酥",
		"選出春季夜晚利用「北斗七星」找北極星的 2 項知識！",
		"杓口兩星延伸五倍",
		"北極星幾乎不動",
		"北極星在正南方",
		"北極星永遠指引正北方！",
		"星星每天位置毫無移動",
		"星星會隨地球自轉東升西落！",
		"simmer",
		"55°C 星光烘培",
		"neutral",
		"中性奶酥",
		"rainbow",
		"將北斗七星杓口兩星連線往外延伸約 5 倍距離，即可找到正北方的北極星。",
		"北極星正好位於地球自轉軸延伸方向。",
		"天文星象"
	],
	[
		"sc-e-5-7",
		5,
		"lower",
		"石蕊試紙魔術湯",
		"選出讓「藍色石蕊試紙變紅色」的 2 種酸性溶液！",
		"柳橙汁",
		"食用白醋",
		"氨水",
		"氨水是鹼性，會讓紅色試紙變藍！",
		"肥皂水",
		"肥皂水是鹼性！",
		"simmer",
		"55°C 檢驗溫水",
		"acid",
		"酸性藍變紅",
		"rainbow",
		"口訣「酸紅鹼藍」：酸性溶液使藍色石蕊試紙變紅，鹼性使紅色變藍。",
		"記住「酸紅鹼藍」！",
		"水溶液酸鹼"
	],
	[
		"sc-e-5-8",
		5,
		"lower",
		"動物保溫毛絨燉鍋",
		"選出屬於「恆溫動物」的 2 種生物！",
		"台灣黑熊（哺乳）",
		"帝王企鵝（鳥類）",
		"綠蠵龜（爬蟲）",
		"烏龜是變溫動物！",
		"青蛙（兩生類）",
		"青蛙是變溫動物！",
		"boil",
		"100°C 暖心恆溫",
		"neutral",
		"中性高湯",
		"nature",
		"哺乳類與鳥類能自行調節體溫維持恆定；魚、兩生、爬蟲類屬於變溫動物。",
		"毛髮與羽毛都能幫助維持體溫。",
		"動物分類"
	],
	[
		"sc-e-5-9",
		5,
		"lower",
		"彈簧測力計拉麵",
		"選出「力與運動」的 2 項正確觀念！",
		"物體受推力改變運動",
		"粗糙面摩擦力較大",
		"摩擦力讓車永遠加速",
		"摩擦力是阻礙相對運動的力！",
		"沒有力物體必變形",
		"需要受力才會發生形變！",
		"boil",
		"100°C 彈性煮麵",
		"neutral",
		"中性湯頭",
		"fire",
		"力可改變物體形狀或運動狀態；鞋底刻紋是為了增加摩擦力防滑。",
		"鞋底為什麼要有凹凸紋路？",
		"力與運動"
	],
	[
		"sc-e-5-10",
		5,
		"lower",
		"聲音共振交響餅",
		"選出影響「樂器音調高低」的 2 項因素！",
		"琴弦越短音越高",
		"琴弦拉越緊音越高",
		"用力拍打音調變高",
		"用力大小影響的是音量（響度），不是音調！",
		"在真空中聲音傳更快",
		"聲音需要介質，在真空中無法傳播！",
		"simmer",
		"55°C 脆響烘焙",
		"neutral",
		"中性脆餅",
		"electric",
		"振動頻率越高音調越高，弦越短、越細、越緊時音調越高。",
		"烏克麗麗按住琴格變短後，聲音變高還是變低？",
		"聲波震動"
	],
	[
		"sc-e-5-11",
		5,
		"lower",
		"熱對流小火鍋",
		"選出熱的三種傳播方式中正確的 2 項例子！",
		"熱水上升冷水下降（對流）",
		"鐵鍋傳熱給湯（傳導）",
		"太陽靠對流穿過太空",
		"太空是真空，太陽靠「熱輻射」傳熱！",
		"冷氣裝地板最涼快",
		"冷空氣會下沉，冷氣應裝在高處！",
		"boil",
		"100°C 對流滾煮",
		"neutral",
		"中性清湯",
		"fire",
		"固體主要靠傳導，液體與氣體靠熱升冷降的對流，太陽熱能靠輻射傳達地球。",
		"想想為什麼冷氣都裝在天花板附近！",
		"熱的傳播"
	],
	[
		"sc-e-5-12",
		5,
		"lower",
		"卵生胎生派對蛋糕",
		"選出屬於「胎生哺乳動物」的 2 種動物！",
		"海豚",
		"蝙蝠",
		"鴨嘴獸",
		"鴨嘴獸是少數卵生的哺乳動物！",
		"企鵝",
		"企鵝是卵生鳥類！",
		"simmer",
		"55°C 溫馨烘焙",
		"neutral",
		"中性鮮奶",
		"nature",
		"海豚與蝙蝠雖分別住在海裡和空中，卻都是標準胎生哺乳動物。",
		"別被翅膀和魚鰭騙囉，牠們都喝母奶長大！",
		"動物繁殖"
	],
	[
		"sc-e-6-1",
		6,
		"upper",
		"颱風氣象雲霧湯",
		"選出台灣「颱風與氣象」的 2 項正確知識！",
		"低氣壓中心形成",
		"北半球逆時針旋轉",
		"颱風眼風雨最大",
		"颱風眼內反而風勢微弱無雨！",
		"高氣壓帶來劇烈暴雨",
		"高氣壓中心通常天氣晴朗穩定！",
		"boil",
		"100°C 旋渦沸騰",
		"neutral",
		"中性水氣",
		"ice",
		"颱風是熱帶海洋上發展的強烈低氣壓，在北半球呈逆時針旋轉。",
		"看衛星雲圖時颱風漩渦是逆時針轉的。",
		"天氣與地質"
	],
	[
		"sc-e-6-2",
		6,
		"upper",
		"岩石礦物千層派",
		"選出由「岩漿冷卻」形成的火成岩與礦物組合！",
		"花崗岩",
		"玄武岩",
		"石灰岩（沉積岩）",
		"石灰岩是生物遺骸堆積的沉積岩！",
		"大理岩（變質岩）",
		"大理岩是石灰岩高溫高壓變質而成！",
		"boil",
		"100°C 岩漿高溫",
		"neutral",
		"中性礦層",
		"fire",
		"花崗岩與澎湖柱狀玄武岩皆屬岩漿冷卻凝固形成的火成岩。",
		"澎湖著名的柱狀岩石就是玄武岩。",
		"岩石與地質"
	],
	[
		"sc-e-6-3",
		6,
		"upper",
		"流水地形峽谷盅",
		"選出「河流侵蝕與堆積」的 2 項正確特徵！",
		"上游水流急多巨石",
		"下游水流緩多細沙",
		"河流上游全是細泥巴",
		"上游落差大流速快，細泥早被沖走了！",
		"凹岸以堆積作用為主",
		"彎道凹岸流速快，以侵蝕作用為主！",
		"simmer",
		"55°C 慢流沉積",
		"neutral",
		"中性溪水",
		"nature",
		"河流上游坡度陡、侵蝕強、石塊有稜角；下游平坦、堆積出圓潤鵝卵石與細沙。",
		"想想海邊沙灘為什麼都是細沙！",
		"天氣與地質"
	],
	[
		"sc-e-6-4",
		6,
		"upper",
		"熱脹冷縮鐵橋鬆餅",
		"選出運用「熱脹冷縮」原理設計的 2 項工程安全裝置！",
		"橋面伸縮縫",
		"鐵軌接縫留空隙",
		"電線冬夏完全拉緊",
		"拉太緊冬天冷縮容易繃斷！",
		"熱水直接沖冰玻璃杯",
		"內外膨脹不均會導致玻璃破裂！",
		"boil",
		"100°C 受熱膨脹",
		"neutral",
		"中性麵糊",
		"fire",
		"金屬與混凝土夏天受熱膨脹、冬天冷縮，橋樑與鐵軌必須預留伸縮縫。",
		"坐火車聽到「喀噠喀噠」就是鐵軌伸縮縫！",
		"熱脹冷縮"
	],
	[
		"sc-e-6-5",
		6,
		"upper",
		"電磁鐵磁浮烤肉",
		"選出能「增強電磁鐵磁力」的 2 種正確做法！",
		"增加串聯電池數量",
		"增加線圈纏繞圈數",
		"改用塑膠吸管當鐵芯",
		"塑膠無法被磁化，磁力會大減！",
		"減少電流改接斷路",
		"斷路時電磁鐵磁力會完全消失！",
		"boil",
		"100°C 強磁炙燒",
		"neutral",
		"中性線圈",
		"electric",
		"增加電流（串聯電池）、增加線圈圈數或放入軟鐵棒皆能顯著增強電磁鐵磁力。",
		"通電才有磁力，繞越多圈越強！",
		"電磁鐵"
	],
	[
		"sc-e-6-6",
		6,
		"upper",
		"食物防腐保鮮盅",
		"選出能「有效減緩食物發霉腐敗」的 2 種方法！",
		"低溫冷藏冷凍",
		"乾燥抽真空密封",
		"放在溫暖潮濕處",
		"溫暖潮濕正是黴菌最愛的生長環境！",
		"噴水後蓋布悶著",
		"高濕度會讓黴菌快速繁殖！",
		"freeze",
		"0°C 低溫抑菌",
		"neutral",
		"中性真空",
		"ice",
		"黴菌生長需要水分、養分與適宜溫度；低溫、乾燥與真空包裝都能抑制黴菌。",
		"想想家裡冰箱和餅乾乾燥劑的作用！",
		"微生物與保鮮"
	],
	[
		"sc-e-6-7",
		6,
		"lower",
		"槓桿省力手打丸",
		"選出屬於「省力槓桿（施力臂＞抗力臂）」的 2 種日常工具！",
		"開瓶器",
		"裁紙刀／核桃夾",
		"烤肉夾",
		"烤肉夾施力點在中間，屬於費力但省時的槓桿！",
		"筷子",
		"筷子是費力但操作靈活的工具！",
		"simmer",
		"55°C 省力慢燉",
		"neutral",
		"中性湯底",
		"electric",
		"當施力臂長於抗力臂時（如開瓶器、指甲剪、獨輪車）可達到省力效果。",
		"開汽水瓶蓋為什麼用開瓶器好輕鬆？",
		"簡單機械"
	],
	[
		"sc-e-6-8",
		6,
		"lower",
		"滑輪組空中纜車派",
		"選出關於「定滑輪與動滑輪」的 2 項正確功能！",
		"定滑輪改變施力方向",
		"動滑輪可省一半力",
		"定滑輪可省四倍力",
		"定滑輪不省力，只改變施力方向！",
		"動滑輪完全不用拉繩",
		"動滑輪省力但拉繩距離加倍！",
		"simmer",
		"55°C 吊爐烘烤",
		"neutral",
		"中性奶油",
		"electric",
		"升旗桿頂端的定滑輪方便向下拉；工地吊掛重物的動滑輪可省力一半。",
		"升旗時我們往下拉，國旗卻往上升！",
		"簡單機械"
	],
	[
		"sc-e-6-9",
		6,
		"lower",
		"生態食物鏈鮮果缽",
		"選出森林食物鏈中的「生產者與分解者」各一項！",
		"綠色大樹（生產者）",
		"香菇真菌（分解者）",
		"老鷹（高級消費者）",
		"老鷹屬於肉食性消費者！",
		"兔子（初級消費者）",
		"兔子是吃植物的消費者！",
		"simmer",
		"55°C 生態慢煮",
		"neutral",
		"中性平衡",
		"nature",
		"綠色植物行光合作用製造養分為生產者；真菌與細菌分解遺體回歸自然為分解者。",
		"誰自己製造養分？誰把枯木分解回泥土？",
		"生態食物鏈"
	],
	[
		"sc-e-6-10",
		6,
		"lower",
		"酸雨防護翡翠湯",
		"選出造成「酸雨」與空氣污染的 2 大主要來源！",
		"工廠燃煤廢氣",
		"汽機車排放尾氣",
		"風力發電葉片",
		"風力發電不燃燒化石燃料，零排放！",
		"森林植物行光合作用",
		"植物能吸收二氧化碳淨化空氣！",
		"simmer",
		"55°C 溫和中和",
		"alkali",
		"鹼性中和酸雨",
		"nature",
		"燃燒煤與石油釋放硫氧化物與氮氧化物，溶入雨水即形成酸雨，危害森林與古蹟。",
		"找會冒出石化廢氣的來源。",
		"環境保護"
	],
	[
		"sc-e-6-11",
		6,
		"lower",
		"齒輪傳動巧克力鍋",
		"選出互相咬合的「大小齒輪」運轉時的 2 項特性！",
		"相鄰齒輪轉向相反",
		"小齒輪轉得比大齒輪快",
		"兩齒輪一定同方向轉",
		"直接咬合的兩齒輪轉動方向必然相反！",
		"大齒輪轉速永遠更快",
		"齒數越多轉一圈花的時間越長！",
		"simmer",
		"55°C 齒輪攪拌",
		"neutral",
		"中性可可",
		"electric",
		"兩個直接咬合的齒輪轉向相反；若大齒輪 20 齒、小齒輪 10 齒，大轉 1 圈小轉 2 圈。",
		"想像兩個齒輪牙齒互相卡住推動。",
		"簡單機械"
	],
	[
		"sc-e-6-12",
		6,
		"lower",
		"再生能源星光飲",
		"選出屬於「取之不盡的再生能源」的 2 項能源！",
		"太陽能光電",
		"地熱與水力發電",
		"煤炭",
		"煤炭屬於不可再生化石燃料！",
		"石油天然氣",
		"石油與天然氣開採完就無法短時間再生！",
		"freeze",
		"0°C 潔淨冷萃",
		"neutral",
		"中性永續",
		"electric",
		"太陽能、風力、水力與地熱皆可自然補充，屬於低碳永續的再生能源。",
		"找不會用光、大自然每天免費提供的能源！",
		"永續能源"
	]
]);
// src/data/proceduralQuestions.ts
function randInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
function gcd(a, b) {
	let x = Math.abs(a);
	let y = Math.abs(b);
	while (y !== 0) {
		const t = x % y;
		x = y;
		y = t;
	}
	return x || 1;
}
function lcm(a, b) {
	return Math.abs(a * b) / gcd(a, b);
}
function buildNumericOptions(correct, unit = "", spread = 6) {
	const vals = /* @__PURE__ */ new Set([correct]);
	const deltas = [
		-spread,
		-Math.max(1, Math.round(spread / 2)),
		Math.max(1, Math.round(spread / 2)),
		spread,
		-1,
		1,
		2,
		-2,
		10,
		-10
	];
	for (const d of deltas) {
		if (vals.size >= 4) break;
		const cand = correct + d;
		if (cand >= 0 && cand !== correct) vals.add(cand);
	}
	for (let offset = 1; vals.size < 4; offset++) vals.add(Math.max(0, correct) + offset);
	const arr = Array.from(vals);
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return {
		options: arr.map((v) => `${v}${unit}`),
		correctIndex: arr.indexOf(correct)
	};
}
function buildStringOptions(correct, distractors) {
	const seen = /* @__PURE__ */ new Set([correct]);
	for (const d of distractors) {
		if (d && !seen.has(d)) seen.add(d);
		if (seen.size >= 4) break;
	}
	let pad = 1;
	while (seen.size < 4) {
		const num = Number(correct);
		const fallback = Number.isFinite(num) ? Number((num + pad * 1.5).toFixed(2)).toString() : `${correct}·${pad}`;
		seen.add(fallback);
		pad++;
	}
	const uniq = Array.from(seen).slice(0, 4);
	for (let i = uniq.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[uniq[i], uniq[j]] = [uniq[j], uniq[i]];
	}
	return {
		options: uniq,
		correctIndex: uniq.indexOf(correct)
	};
}
function stageToDifficulty(stageNumber) {
	if (!stageNumber || stageNumber <= 3) return 1;
	if (stageNumber <= 7) return 2;
	return 3;
}
/**
* Procedural 108-Curriculum Math Generator (Never Repeats!).
* Dynamically crafts fresh arithmetic, bracket order-of-ops, fractions, decimals,
* GCD/LCM, geometry area/volume, speed, ratio, and percentage questions scaled by
* Grade (3-6) and Stage Tier (1-3).
*/
function generateProceduralMathQuestions(grade, semester, stageNumber = 1, count = 16) {
	const diff = stageToDifficulty(stageNumber);
	const out = [];
	const usedFormulas = /* @__PURE__ */ new Set();
	const salt = Date.now().toString(36);
	let tries = 0;
	while (out.length < count && tries < count * 6) {
		const i = tries++;
		let formulaShield = "";
		let prompt = "";
		let answer = "";
		let explanation = "";
		let hint = "";
		let knowledgeTag = "動態算術";
		let qType = "calc";
		let optPack = {
			options: [],
			correctIndex: 0
		};
		const pattern = (i + randInt(0, 5)) % 5;
		if (grade === 1) {
			if (pattern === 0) {
				const a = diff === 1 ? randInt(3, 12) : randInt(10, 35);
				const b = diff === 1 ? randInt(2, 9) : randInt(5, 25);
				const ans = a + b;
				formulaShield = `${a} + ${b} = ?`;
				prompt = `加法練習：${a} + ${b} = ?`;
				answer = String(ans);
				explanation = `把 ${a} 和 ${b} 合起來，一共有 ${ans}。`;
				hint = "可以先湊成 10，再把剩下的加上去！";
				knowledgeTag = "100以內加法";
				optPack = buildNumericOptions(ans, "", 3);
			} else if (pattern === 1) {
				const a = diff === 1 ? randInt(10, 20) : randInt(25, 68);
				const b = randInt(3, Math.min(a - 1, diff === 1 ? 9 : 22));
				const ans = a - b;
				formulaShield = `${a} - ${b} = ?`;
				prompt = `減法練習：${a} - ${b} = ?`;
				answer = String(ans);
				explanation = `從 ${a} 拿走 ${b}，還剩下 ${ans}。`;
				hint = "先算個位，不夠減時向十位借 10。";
				knowledgeTag = "100以內減法";
				optPack = buildNumericOptions(ans, "", 3);
			} else if (pattern === 2) {
				const tens = randInt(2, 8);
				const ones = randInt(1, 9);
				const ans = tens * 10 + ones;
				formulaShield = `${tens}個十和${ones}個一`;
				prompt = `${tens} 個十和 ${ones} 個一合起來是多少？`;
				answer = String(ans);
				explanation = `${tens} 個十是 ${tens * 10}，加上 ${ones} 個一是 ${ans}。`;
				hint = "十位放前面，個位放後面！";
				knowledgeTag = "認識兩位數";
				optPack = buildNumericOptions(ans, "", 10);
			} else if (pattern === 3) {
				qType = "geometry";
				const hour = randInt(1, 12);
				const nextHour = hour === 12 ? 1 : hour + 1;
				formulaShield = `${hour}點過1小時`;
				prompt = `時鐘現在指在 ${hour} 點鐘，再過 1 小時是幾點鐘？`;
				answer = `${nextHour}點`;
				explanation = `${hour} 點往後走 1 小時是 ${nextHour} 點鐘。`;
				hint = "看時鐘短針順時針往下走一格！";
				knowledgeTag = "認識時鐘整點";
				optPack = buildNumericOptions(nextHour, "點", 2);
			} else {
				const coins = randInt(3, 9);
				const ans = coins * 5;
				formulaShield = `${coins}個5元=?元`;
				prompt = `存錢筒裡有 ${coins} 個 5 元硬幣，一共是多少元？`;
				answer = `${ans}元`;
				explanation = `五個五個數 ${coins} 次：5 × ${coins} = ${ans} 元。`;
				hint = "用 5、10、15、20 的方式數數看！";
				knowledgeTag = "錢幣數數";
				optPack = buildNumericOptions(ans, "元", 5);
			}
		} else if (grade === 2) {
			if (pattern === 0) {
				const a = randInt(2, 9);
				const b = randInt(2, 9);
				const ans = a * b;
				formulaShield = `${a} × ${b} = ?`;
				prompt = `九九乘法挑戰：${a} × ${b} = ?`;
				answer = String(ans);
				explanation = `背誦乘法口訣：${a} × ${b} = ${ans}。`;
				hint = `把 ${a} 連加 ${b} 次想想看！`;
				knowledgeTag = "九九乘法";
				optPack = buildNumericOptions(ans, "", a);
			} else if (pattern === 1) {
				const a = randInt(28, 76);
				const b = randInt(15, 58);
				const ans = a + b;
				formulaShield = `${a} + ${b} = ?`;
				prompt = `二位數進位加法：${a} + ${b} = ?`;
				answer = String(ans);
				explanation = `個位相加滿 10 進 1 到十位：${a} + ${b} = ${ans}。`;
				hint = "個位先加，滿 10 記得進位到十位喔！";
				knowledgeTag = "二位數加減";
				optPack = buildNumericOptions(ans, "", 8);
			} else if (pattern === 2) {
				const a = randInt(42, 95);
				const b = randInt(14, a - 10);
				const ans = a - b;
				formulaShield = `${a} - ${b} = ?`;
				prompt = `二位數退位減法：${a} - ${b} = ?`;
				answer = String(ans);
				explanation = `直式退位計算：${a} - ${b} = ${ans}。`;
				hint = "個位不夠減就向十位借 1 個十來減。";
				knowledgeTag = "二位數加減";
				optPack = buildNumericOptions(ans, "", 6);
			} else if (pattern === 3) {
				qType = "geometry";
				const m = randInt(1, 5);
				const cm = randInt(10, 80);
				const total = m * 100 + cm;
				formulaShield = `${m}公尺${cm}公分`;
				prompt = `一條彩帶長 ${m} 公尺 ${cm} 公分，合起來是多少公分？`;
				answer = `${total}公分`;
				explanation = `1 公尺 = 100 公分，所以 ${m} 公尺 ${cm} 公分 = ${total} 公分。`;
				hint = "記住 1 公尺等於 100 公分！";
				knowledgeTag = "長度單位";
				optPack = buildNumericOptions(total, "公分", 20);
			} else {
				qType = "geometry";
				const sides = [
					3,
					4,
					5,
					6
				][randInt(0, 3)];
				const names = {
					3: "三角形",
					4: "長方形",
					5: "五邊形",
					6: "六邊形"
				};
				formulaShield = `${names[sides]}有幾條邊`;
				prompt = `幾何圖形小測驗：一個「${names[sides]}」共有幾條邊？`;
				answer = `${sides}條`;
				explanation = `${names[sides]}由 ${sides} 條直邊圍成。`;
				hint = "從圖形名稱就可以看出邊的數量喔！";
				knowledgeTag = "平面圖形與邊角";
				optPack = buildNumericOptions(sides, "條", 1);
			}
		} else if (grade === 3) {
			if (pattern === 0) {
				const a = diff === 1 ? randInt(120, 450) : randInt(280, 760);
				const b = diff === 1 ? randInt(80, 320) : randInt(150, 490);
				const ans = a + b;
				formulaShield = `${a} + ${b} = ?`;
				prompt = `快速計算三位數加法：${a} + ${b} = ?`;
				answer = String(ans);
				explanation = `個位、十位、百位對齊進位計算：${a} + ${b} = ${ans}。`;
				hint = "先把整百相加，再處理十位與個位進位。";
				knowledgeTag = "三位數加減";
				optPack = buildNumericOptions(ans, "", 10);
			} else if (pattern === 1) {
				const a = randInt(4, 9);
				const b = diff === 1 ? randInt(12, 28) : randInt(25, 79);
				const ans = a * b;
				formulaShield = `${b} × ${a} = ?`;
				prompt = `估算並計算乘法：${b} × ${a} = ?`;
				answer = String(ans);
				explanation = `拆解成整十乘與個位乘：${b} × ${a} = ${ans}。`;
				hint = "先算十位乘以一位數，再加上個位的乘積。";
				knowledgeTag = "二位數乘法";
				optPack = buildNumericOptions(ans, "", a);
			} else if (pattern === 2) {
				const d = randInt(3, 9);
				const q = diff === 1 ? randInt(6, 15) : randInt(12, 26);
				const dividend = d * q;
				formulaShield = `${dividend} ÷ ${d} = ?`;
				prompt = `整除除法挑戰：${dividend} ÷ ${d} = ?`;
				answer = String(q);
				explanation = `因為 ${d} × ${q} = ${dividend}，所以商為 ${q}。`;
				hint = `想一想 ${d} 乘以多少等於 ${dividend}。`;
				knowledgeTag = "整數除法";
				optPack = buildNumericOptions(q, "", 3);
			} else if (pattern === 3) {
				qType = "geometry";
				const w = randInt(5, 16);
				const h = randInt(4, 14);
				const peri = (w + h) * 2;
				formulaShield = `長${w}寬${h} 周長=?`;
				prompt = `一個長方形花圃長 ${w} 公尺、寬 ${h} 公尺，周長是多少公尺？`;
				answer = `${peri}公尺`;
				explanation = `長方形周長 = (長 + 寬) × 2 = (${w} + ${h}) × 2 = ${peri} 公尺。`;
				hint = "周長是四條邊加起來，等於 (長+寬)×2。";
				knowledgeTag = "周長計算";
				optPack = buildNumericOptions(peri, "公尺", 4);
			} else {
				qType = "fraction";
				const den = randInt(5, 12);
				const n1 = randInt(1, Math.floor(den / 2));
				const n2 = randInt(1, den - n1);
				const sumN = n1 + n2;
				formulaShield = `${n1}/${den} + ${n2}/${den}`;
				prompt = `同分母分數加法：${n1}/${den} + ${n2}/${den} = ?`;
				answer = `${sumN}/${den}`;
				explanation = `同分母分數相加，分母不變，分子相加：(${n1}+${n2})/${den} = ${sumN}/${den}。`;
				hint = "分母保持不變，只要把分子加起來！";
				knowledgeTag = "同分母分數";
				optPack = buildStringOptions(answer, [
					`${sumN}/${den * 2}`,
					`${Math.max(1, sumN - 1)}/${den}`,
					`${sumN + 1}/${den}`
				]);
			}
		} else if (grade === 4) {
			if (pattern === 0) {
				const a = randInt(6, 18);
				const b = randInt(4, 15);
				const c = randInt(3, 8);
				const ans = (a + b) * c;
				formulaShield = `(${a}+${b})×${c}`;
				prompt = `四則括號運算：(${a} + ${b}) × ${c} = ?`;
				answer = String(ans);
				explanation = `括號最先算：${a}+${b}=${a + b}，再乘以 ${c} 得 ${ans}。`;
				hint = "先算小括號裡的加法，再做乘法！";
				knowledgeTag = "四則括號運算";
				optPack = buildNumericOptions(ans, "", c);
			} else if (pattern === 1) {
				const a = randInt(14, 38);
				const b = randInt(12, 29);
				const ans = a * b;
				formulaShield = `${a} × ${b} = ?`;
				prompt = `二位數乘以二位數：${a} × ${b} = ?`;
				answer = String(ans);
				explanation = `直式乘法計算：${a} × ${b} = ${ans}。`;
				hint = "可將第二數拆成十位與個位分別相乘再相加。";
				knowledgeTag = "二位數乘法";
				optPack = buildNumericOptions(ans, "", 12);
			} else if (pattern === 2) {
				qType = "geometry";
				const side = randInt(7, 22);
				const area = side * side;
				formulaShield = `邊長${side} 面積=?`;
				prompt = `正方形磁磚的邊長是 ${side} 公分，面積是多少平方公分？`;
				answer = `${area}平方公分`;
				explanation = `正方形面積 = 邊長 × 邊長 = ${side} × ${side} = ${area} 平方公分。`;
				hint = "面積等於邊長乘以自己，別和周長搞混喔！";
				knowledgeTag = "正方形面積";
				optPack = buildNumericOptions(area, "平方公分", side);
			} else if (pattern === 3) {
				const a = randInt(12, 65);
				const b = randInt(11, 58);
				const ans = Number(((a + b) / 10).toFixed(1));
				formulaShield = `${(a / 10).toFixed(1)}+${(b / 10).toFixed(1)}`;
				prompt = `小數加法精算：${(a / 10).toFixed(1)} + ${(b / 10).toFixed(1)} = ?`;
				answer = ans.toFixed(1);
				explanation = `小數點對齊相加：${(a / 10).toFixed(1)} + ${(b / 10).toFixed(1)} = ${ans.toFixed(1)}。`;
				hint = "小數點上下對齊，十分位滿 10 進 1 到個位。";
				knowledgeTag = "小數加減";
				optPack = buildStringOptions(ans.toFixed(1), [
					(ans + .2).toFixed(1),
					Math.max(.1, ans - .3).toFixed(1),
					(ans + 1).toFixed(1)
				]);
			} else {
				const b = randInt(4, 9);
				const c = randInt(3, 8);
				const a = randInt(Math.max(40, b * c), 120);
				const ans = a - b * c;
				formulaShield = `${a} - ${b}×${c}`;
				prompt = `先乘除後加減：${a} - ${b} × ${c} = ?`;
				answer = String(ans);
				explanation = `先算乘法 ${b}×${c}=${b * c}，再算 ${a}-${b * c}=${ans}。`;
				hint = "千萬記得先算乘法，再做減法！";
				knowledgeTag = "四則運算順序";
				optPack = buildNumericOptions(ans, "", 6);
			}
		} else if (grade === 5) {
			if (pattern === 0) {
				const base = randInt(3, 9);
				const m1 = randInt(2, 6);
				let m2 = randInt(2, 7);
				if (m2 === m1) m2 += 1;
				const n1 = base * m1;
				const n2 = base * m2;
				const g = gcd(n1, n2);
				formulaShield = `GCD(${n1},${n2})`;
				prompt = `求出 ${n1} 與 ${n2} 的「最大公因數」是多少？`;
				answer = String(g);
				explanation = `${n1} 與 ${n2} 同時能被最大整數 ${g} 整除。`;
				hint = "用短除法找出共同質因數相乘！";
				knowledgeTag = "因數與最大公因數";
				optPack = buildNumericOptions(g, "", Math.max(2, base));
			} else if (pattern === 1) {
				const a = randInt(4, 12);
				const b = randInt(5, 14);
				const l = lcm(a, b);
				formulaShield = `LCM(${a},${b})`;
				prompt = `求出 ${a} 與 ${b} 的「最小公倍數」是多少？`;
				answer = String(l);
				explanation = `${a} 與 ${b} 的最小公倍數為 ${l}。`;
				hint = "把較大數的倍數依序列出，找第一個能被另一數整除的！";
				knowledgeTag = "倍數與最小公倍數";
				optPack = buildNumericOptions(l, "", a);
			} else if (pattern === 2) {
				qType = "geometry";
				const base = randInt(6, 18) * 2;
				const h = randInt(5, 16);
				const area = base * h / 2;
				formulaShield = `底${base}高${h} △面積`;
				prompt = `一個三角形底邊長 ${base} 公分、高 ${h} 公分，面積是多少平方公分？`;
				answer = `${area}平方公分`;
				explanation = `三角形面積 = 底 × 高 ÷ 2 = ${base} × ${h} ÷ 2 = ${area} 平方公分。`;
				hint = "三角形面積記得要除以 2！";
				knowledgeTag = "三角形面積";
				optPack = buildNumericOptions(area, "平方公分", h);
			} else if (pattern === 3) {
				qType = "geometry";
				const l = randInt(4, 10);
				const w = randInt(3, 8);
				const h = randInt(3, 7);
				const vol = l * w * h;
				formulaShield = `${l}×${w}×${h} 體積`;
				prompt = `長方體木箱長 ${l}、寬 ${w}、高 ${h} 公分，體積是多少立方公分？`;
				answer = `${vol}立方公分`;
				explanation = `長方體體積 = 長 × 寬 × 高 = ${l} × ${w} × ${h} = ${vol} 立方公分。`;
				hint = "將長、寬、高三個邊長相乘！";
				knowledgeTag = "長方體體積";
				optPack = buildNumericOptions(vol, "立方公分", l * w);
			} else {
				qType = "fraction";
				const d1 = [
					2,
					3,
					4,
					5
				][randInt(0, 3)];
				const d2 = [
					3,
					4,
					5,
					6
				].find((x) => x !== d1) ?? 6;
				const l = lcm(d1, d2);
				const num = l / d1 + l / d2;
				const g = gcd(num, l);
				const ans = `${num / g}/${l / g}`;
				formulaShield = `1/${d1} + 1/${d2}`;
				prompt = `異分母分數通分相加：1/${d1} + 1/${d2} = ?（約至最簡）`;
				answer = ans;
				explanation = `通分成分母 ${l}：${l / d1}/${l} + ${l / d2}/${l} = ${num}/${l} = ${ans}。`;
				hint = `先找 ${d1} 和 ${d2} 的最小公倍數 ${l} 通分！`;
				knowledgeTag = "異分母分數加減";
				optPack = buildStringOptions(ans, [
					`2/${d1 + d2}`,
					`${Math.max(1, num / g - 1)}/${l / g}`,
					`${num / g + 1}/${l / g}`
				]);
			}
		} else if (pattern === 0) {
			const speed = randInt(45, 95);
			const hrs = randInt(2, 5);
			const dist = speed * hrs;
			formulaShield = `時速${speed} × ${hrs}時`;
			prompt = `高鐵接駁車以時速 ${speed} 公里行駛 ${hrs} 小時，共前進幾公里？`;
			answer = `${dist}公里`;
			explanation = `距離 = 速率 × 時間 = ${speed} × ${hrs} = ${dist} 公里。`;
			hint = "距離 = 速率 × 時間！";
			knowledgeTag = "速率與距離";
			optPack = buildNumericOptions(dist, "公里", speed);
		} else if (pattern === 1) {
			const price = randInt(4, 18) * 50;
			const off = [
				70,
				75,
				80,
				85,
				90
			][randInt(0, 4)];
			const finalPrice = Math.round(price * off / 100);
			formulaShield = `${price}元 打${off / 10}折`;
			prompt = `原價 ${price} 元的繪本套書打 ${off === 75 ? "75" : off === 85 ? "85" : off / 10} 折（${off}%），特價多少元？`;
			answer = `${finalPrice}元`;
			explanation = `特價 = ${price} × ${off}% = ${finalPrice} 元。`;
			hint = `把原價乘以 ${off / 100} 就能得到折扣價！`;
			knowledgeTag = "百分率與折扣";
			optPack = buildNumericOptions(finalPrice, "元", 25);
		} else if (pattern === 2) {
			const a = randInt(2, 5);
			const b = randInt(3, 7);
			const mult = randInt(3, 9);
			const target = b * mult;
			formulaShield = `${a}:${b} = ${a * mult}:?`;
			prompt = `相等比例求解：${a} : ${b} = ${a * mult} : □，□ 是多少？`;
			answer = String(target);
			explanation = `前項放大了 ${mult} 倍，後項也放大 ${mult} 倍：${b} × ${mult} = ${target}。`;
			hint = `先算出 ${a * mult} 是 ${a} 的幾倍！`;
			knowledgeTag = "比與比值";
			optPack = buildNumericOptions(target, "", b);
		} else if (pattern === 3) {
			qType = "fraction";
			const n1 = randInt(2, 5);
			const d1 = randInt(3, 7);
			const n2 = randInt(2, 6);
			const d2 = randInt(3, 8);
			const top = n1 * n2;
			const bot = d1 * d2;
			const g = gcd(top, bot);
			const ans = `${top / g}/${bot / g}`;
			formulaShield = `${n1}/${d1} × ${n2}/${d2}`;
			prompt = `分數乘法約分計算：${n1}/${d1} × ${n2}/${d2} = ?`;
			answer = ans;
			explanation = `分子乘分子、分母乘分母：${top}/${bot}，上下同除 ${g} 得 ${ans}。`;
			hint = "分子相乘、分母相乘後，記得約分到最簡分數！";
			knowledgeTag = "分數乘除";
			optPack = buildStringOptions(ans, [
				`${top / g + 1}/${bot / g}`,
				`${Math.max(1, top / g - 1)}/${bot / g}`,
				`${n1 + n2}/${d1 + d2}`
			]);
		} else {
			const r = randInt(2, 10);
			const area = Number((r * r * 3.14).toFixed(2));
			formulaShield = `半徑${r} 圓面積`;
			prompt = `半徑為 ${r} 公分的魔法陣，圓面積約是多少平方公分？（圓周率取 3.14）`;
			answer = `${area}`;
			explanation = `圓面積 = 半徑 × 半徑 × 3.14 = ${r} × ${r} × 3.14 = ${area}。`;
			hint = "圓面積公式是 半徑 × 半徑 × 3.14！";
			knowledgeTag = "圓面積計算";
			qType = "geometry";
			optPack = buildStringOptions(answer, [
				Number((r * 2 * 3.14).toFixed(2)).toString(),
				Number(((r + 1) * r * 3.14).toFixed(2)).toString(),
				Number((r * r * 3).toFixed(2)).toString()
			]);
		}
		if (usedFormulas.has(formulaShield)) continue;
		usedFormulas.add(formulaShield);
		out.push({
			id: `proc_math_g${grade}_${semester}_d${diff}_${salt}_${i}`,
			grade,
			semester,
			subject: "math",
			type: qType,
			prompt,
			answer,
			explanation,
			hint,
			knowledgeTag,
			difficulty: diff,
			payload: {
				formulaShield,
				options: optPack.options,
				correctIndex: optPack.correctIndex
			}
		});
	}
	return out;
}
var EXTRA_CHINESE_SLASH = [
	{
		grade: 1,
		semester: "upper",
		diff: 1,
		prompt: "「一（ ）大樹」括號裡最適合填入哪個量詞？",
		options: [
			"棵",
			"隻",
			"本",
			"條"
		],
		correctIndex: 0,
		tag: "基礎量詞",
		explanation: "形容樹木常用量詞「棵」，例如一棵大樹。"
	},
	{
		grade: 1,
		semester: "upper",
		diff: 1,
		prompt: "下列哪個字和「太陽」有關，是「日部」？",
		options: [
			"明",
			"江",
			"林",
			"花"
		],
		correctIndex: 0,
		tag: "部首辨識",
		explanation: "「明」由日和月組成，與光明太陽有關。"
	},
	{
		grade: 1,
		semester: "upper",
		diff: 1,
		prompt: "「早上」的反義詞是哪一個？",
		options: [
			"晚上",
			"明天",
			"昨天",
			"中午"
		],
		correctIndex: 0,
		tag: "反義詞",
		explanation: "「早上」對應的反義詞是「晚上」。"
	},
	{
		grade: 1,
		semester: "lower",
		diff: 1,
		prompt: "「一（ ）小鳥在天空飛」應該填哪個量詞？",
		options: [
			"隻",
			"張",
			"把",
			"朵"
		],
		correctIndex: 0,
		tag: "基礎量詞",
		explanation: "形容小動物常用量詞「隻」。"
	},
	{
		grade: 1,
		semester: "lower",
		diff: 1,
		prompt: "下列哪個字和「樹木」有關，是「木部」？",
		options: [
			"林",
			"河",
			"草",
			"星"
		],
		correctIndex: 0,
		tag: "部首辨識",
		explanation: "兩個木合起來成「林」，表示很多樹木。"
	},
	{
		grade: 1,
		semester: "lower",
		diff: 2,
		prompt: "「太陽公公對我們笑咪咪」把太陽當作人來寫，感覺很親切。這句話主要寫什麼天氣？",
		options: [
			"晴天出太陽",
			"下大雨打雷",
			"颳大颱風",
			"下大雪"
		],
		correctIndex: 0,
		tag: "句子理解",
		explanation: "太陽笑咪咪形容陽光溫暖的晴朗好天氣。"
	},
	{
		grade: 2,
		semester: "upper",
		diff: 1,
		prompt: "「高高興興」和下列哪個詞語意思最相近？",
		options: [
			"開開心心",
			"傷傷心心",
			"安安靜靜",
			"慢吞吞"
		],
		correctIndex: 0,
		tag: "近義詞",
		explanation: "「高高興興」與「開開心心」都形容非常快樂。"
	},
	{
		grade: 2,
		semester: "upper",
		diff: 1,
		prompt: "請問句子結束時要使用哪一種標點符號？",
		options: [
			"句號（。）",
			"問號（？）",
			"頓號（、）",
			"冒號（：）"
		],
		correctIndex: 0,
		tag: "標點符號",
		explanation: "一般陳述句說完一個完整意思時使用句號「。」。"
	},
	{
		grade: 2,
		semester: "upper",
		diff: 2,
		prompt: "「請、清、晴」三個字都帶有「青」，哪一個跟「天氣」有關？",
		options: [
			"晴",
			"清",
			"請",
			"情"
		],
		correctIndex: 0,
		tag: "形近字辨析",
		explanation: "「晴」是日部，代表太陽出來、天氣晴朗。"
	},
	{
		grade: 2,
		semester: "lower",
		diff: 1,
		prompt: "「一心一意」用來形容做事的態度是怎樣的？",
		options: [
			"非常專心一致",
			"常常分心忘記",
			"動作非常慢",
			"喜歡到處玩"
		],
		correctIndex: 0,
		tag: "成語典故",
		explanation: "一心一意形容心思專注、毫不分心。"
	},
	{
		grade: 2,
		semester: "lower",
		diff: 2,
		prompt: "「白雲像棉花糖一樣軟綿綿的」用了哪一種修辭法？",
		options: [
			"譬喻法",
			"設問法",
			"誇飾法",
			"排比法"
		],
		correctIndex: 0,
		tag: "譬喻修辭",
		explanation: "用「像」把白雲比喻成棉花糖，屬於譬喻法。"
	},
	{
		grade: 2,
		semester: "lower",
		diff: 2,
		prompt: "「小花在風裡跳舞」把小花寫得像人一樣，這是什麼修辭？",
		options: [
			"擬人法",
			"對偶法",
			"引用法",
			"倒反法"
		],
		correctIndex: 0,
		tag: "修辭辨析",
		explanation: "賦予小花人類「跳舞」的動作，是擬人法。"
	},
	{
		grade: 3,
		semester: "upper",
		diff: 1,
		prompt: "「畫蛇添足」這個成語用來比喻什麼行為？",
		options: [
			"多此一舉反把事弄糟",
			"畫畫非常有天分",
			"動作快如閃電",
			"非常珍惜時間"
		],
		correctIndex: 0,
		tag: "成語典故",
		explanation: "畫蛇添足比喻做了多餘的事，反而弄巧成拙。"
	},
	{
		grade: 3,
		semester: "upper",
		diff: 1,
		prompt: "下列哪個字是「水部（氵）」且與液體流動有關？",
		options: [
			"江",
			"紅",
			"林",
			"晴"
		],
		correctIndex: 0,
		tag: "部首辨識",
		explanation: "「江」從水部（氵），指大河川。"
	},
	{
		grade: 3,
		semester: "upper",
		diff: 2,
		prompt: "「小草在微風中點頭微笑」運用了哪一種修辭法？",
		options: [
			"擬人法",
			"誇飾法",
			"設問法",
			"倒反法"
		],
		correctIndex: 0,
		tag: "修辭辨析",
		explanation: "將小草寫成會點頭微笑，賦予人的動作，是「擬人法」。"
	},
	{
		grade: 3,
		semester: "lower",
		diff: 1,
		prompt: "「守株待兔」勸戒人們不可以怎樣？",
		options: [
			"妄想不勞而獲",
			"勇敢面對困難",
			"熱心幫助鄰居",
			"愛護野生動物"
		],
		correctIndex: 0,
		tag: "成語典故",
		explanation: "守株待兔比喻死守狹隘經驗，妄想不努力就得到收穫。"
	},
	{
		grade: 3,
		semester: "lower",
		diff: 2,
		prompt: "「月亮像一艘金色的小船」運用了哪種修辭？",
		options: [
			"譬喻法",
			"排比法",
			"借代法",
			"頂真法"
		],
		correctIndex: 0,
		tag: "譬喻修辭",
		explanation: "用「像」把月亮比喻成金色小船，屬於明喻（譬喻法）。"
	},
	{
		grade: 3,
		semester: "lower",
		diff: 3,
		prompt: "選出「多音字」讀音正確的詞語：「調」查與「調」整分別讀作？",
		options: [
			"ㄉㄧㄠˋ／ㄊㄧㄠˊ",
			"ㄊㄧㄠˊ／ㄉㄧㄠˋ",
			"ㄉㄧㄠˋ／ㄉㄧㄠˋ",
			"ㄊㄧㄠˊ／ㄊㄧㄠˊ"
		],
		correctIndex: 0,
		tag: "多音字辨析",
		explanation: "「調」查讀 ㄉㄧㄠˋ，「調」整讀 ㄊㄧㄠˊ。"
	},
	{
		grade: 4,
		semester: "upper",
		diff: 1,
		prompt: "「井底之蛙」常用來形容怎樣的人？",
		options: [
			"見識狹隘短淺的人",
			"擅長游泳的選手",
			"個性活潑開朗的人",
			"記憶力超群的人"
		],
		correctIndex: 0,
		tag: "成語應用",
		explanation: "井底之蛙比喻眼界狹小、見識短淺。"
	},
	{
		grade: 4,
		semester: "upper",
		diff: 2,
		prompt: "「他緊張得心臟快跳出胸口了」屬於哪種修辭法？",
		options: [
			"誇飾法",
			"引用法",
			"雙關法",
			"對偶法"
		],
		correctIndex: 0,
		tag: "誇飾修辭",
		explanation: "誇張描述緊張的感覺，屬於「誇飾法」。"
	},
	{
		grade: 4,
		semester: "upper",
		diff: 3,
		prompt: "下列哪一組字形相近但部首完全不同？",
		options: [
			"辯／辨／辮",
			"江／河／湖",
			"松／柏／楓",
			"跑／跳／躍"
		],
		correctIndex: 0,
		tag: "形近字辨析",
		explanation: "辯（言）、辨（刀）、辮（糸）中間部件不同，意義各異。"
	},
	{
		grade: 4,
		semester: "lower",
		diff: 1,
		prompt: "「半途而廢」的反義成語是哪一個？",
		options: [
			"持之以恆",
			"虎頭蛇尾",
			"前功盡棄",
			"一曝十寒"
		],
		correctIndex: 0,
		tag: "反義成語",
		explanation: "持之以恆指長久堅持，與半途而廢相反。"
	},
	{
		grade: 4,
		semester: "lower",
		diff: 2,
		prompt: "「讀書破萬卷，下筆如有神」強調什麼重要性？",
		options: [
			"大量閱讀能提升寫作力",
			"寫字速度要非常快",
			"只讀一本書就夠了",
			"要用最貴的毛筆寫字"
		],
		correctIndex: 0,
		tag: "名言理解",
		explanation: "杜甫名句強調博覽群書、累積深厚底蘊，寫作自然得心應手。"
	},
	{
		grade: 4,
		semester: "lower",
		diff: 3,
		prompt: "「行」動與銀「行」的讀音分別為何？",
		options: [
			"ㄒㄧㄥˊ／ㄏㄤˊ",
			"ㄏㄤˊ／ㄒㄧㄥˊ",
			"ㄒㄧㄥˊ／ㄒㄧㄥˊ",
			"ㄏㄤˊ／ㄏㄤˊ"
		],
		correctIndex: 0,
		tag: "多音字辨析",
		explanation: "「行」動讀 ㄒㄧㄥˊ，銀「行」讀 ㄏㄤˊ。"
	},
	{
		grade: 5,
		semester: "upper",
		diff: 1,
		prompt: "「有的在讀書，有的在畫畫，有的在下棋」運用了什麼修辭？",
		options: [
			"排比法",
			"映襯法",
			"回文法",
			"倒裝法"
		],
		correctIndex: 0,
		tag: "排比修辭",
		explanation: "連續使用三個結構相似的「有的在……」句型，為排比法。"
	},
	{
		grade: 5,
		semester: "upper",
		diff: 2,
		prompt: "「杯弓蛇影」最適合形容下列哪種情境？",
		options: [
			"疑神疑鬼自己嚇自己",
			"射箭技術百步穿楊",
			"請客吃飯非常大方",
			"克服恐懼勇敢冒險"
		],
		correctIndex: 0,
		tag: "成語情境",
		explanation: "比喻因疑心而過度驚慌，把杯中弓影誤當成蛇。"
	},
	{
		grade: 5,
		semester: "upper",
		diff: 3,
		prompt: "「雖然下著大雨，但是我們仍然準時抵達」屬於何種複句？",
		options: [
			"轉折複句",
			"條件複句",
			"因果複句",
			"遞進複句"
		],
		correctIndex: 0,
		tag: "句型結構",
		explanation: "使用「雖然……但是……」連接前後相反語意，為轉折複句。"
	},
	{
		grade: 5,
		semester: "lower",
		diff: 2,
		prompt: "「破釜沉舟」表現了主帥怎樣的決心？",
		options: [
			"不留退路決一死戰",
			"擅長建造大型船艦",
			"喜歡在河邊野炊",
			"打算立刻撤軍投降"
		],
		correctIndex: 0,
		tag: "歷史成語",
		explanation: "項羽渡河後砸鍋沉船，表示絕不退縮的必勝決心。"
	},
	{
		grade: 5,
		semester: "lower",
		diff: 3,
		prompt: "「不僅會彈鋼琴，而且還會寫程式」屬於哪一種複句？",
		options: [
			"遞進複句",
			"假設複句",
			"選擇複句",
			"轉折複句"
		],
		correctIndex: 0,
		tag: "複句分析",
		explanation: "「不僅……而且……」表示程度更進一步，為遞進複句。"
	},
	{
		grade: 6,
		semester: "upper",
		diff: 2,
		prompt: "「欲窮千里目，更上一層樓」蘊含什麼人生哲理？",
		options: [
			"不斷精進才能看得更遠",
			"一定要蓋最高的大樓",
			"視力不好需要戴眼鏡",
			"爬樓梯可以鍛鍊腿力"
		],
		correctIndex: 0,
		tag: "古詩賞析",
		explanation: "王之渙《登鸛雀樓》勉勵人精益求精，站得更高才能眼界更廣。"
	},
	{
		grade: 6,
		semester: "upper",
		diff: 3,
		prompt: "「朱門酒肉臭，路有凍死骨」強烈運用了哪種修辭？",
		options: [
			"映襯法",
			"頂真法",
			"設問法",
			"雙關法"
		],
		correctIndex: 0,
		tag: "高階修辭",
		explanation: "以豪門奢華與路邊飢寒形成強烈對比，是映襯（對比）法。"
	},
	{
		grade: 6,
		semester: "lower",
		diff: 2,
		prompt: "「臥薪嘗膽」的主角越王勾踐展現了什麼精神？",
		options: [
			"刻苦自勵發憤圖強",
			"貪圖享樂揮霍無度",
			"輕敵大意慘遭失敗",
			"盲目跟風失去主見"
		],
		correctIndex: 0,
		tag: "歷史成語",
		explanation: "勾踐睡柴草、嘗苦膽，時刻提醒自己不忘恥辱、勵精圖治。"
	},
	{
		grade: 6,
		semester: "lower",
		diff: 3,
		prompt: "「哪裡有壓迫，哪裡就有反抗」與下列哪句修辭最接近？",
		options: [
			"頂真與類疊",
			"借代與轉品",
			"譬喻與誇飾",
			"雙關與倒反"
		],
		correctIndex: 0,
		tag: "修辭綜合",
		explanation: "重複「哪裡……哪裡……」形成強烈語勢的類疊結構。"
	}
];
var EXTRA_CHINESE_RADICALS = [
	{
		grade: 1,
		semester: "upper",
		diff: 1,
		partA: "日",
		partB: "月",
		targetChar: "明",
		meaning: "太陽月亮一起亮起來",
		pool: [
			"日",
			"月",
			"木",
			"水",
			"口",
			"火"
		]
	},
	{
		grade: 1,
		semester: "lower",
		diff: 1,
		partA: "木",
		partB: "木",
		targetChar: "林",
		meaning: "很多樹木聚成樹林",
		pool: [
			"木",
			"木",
			"日",
			"水",
			"土",
			"石"
		]
	},
	{
		grade: 2,
		semester: "upper",
		diff: 1,
		partA: "女",
		partB: "子",
		targetChar: "好",
		meaning: "美好良善（會意字）",
		pool: [
			"女",
			"子",
			"口",
			"日",
			"木",
			"心"
		]
	},
	{
		grade: 2,
		semester: "lower",
		diff: 1,
		partA: "日",
		partB: "青",
		targetChar: "晴",
		meaning: "天氣晴朗（形聲字）",
		pool: [
			"日",
			"青",
			"氵",
			"言",
			"心",
			"木"
		]
	},
	{
		grade: 3,
		semester: "upper",
		diff: 1,
		partA: "女",
		partB: "子",
		targetChar: "好",
		meaning: "美好、良善（會意字）",
		pool: [
			"女",
			"子",
			"口",
			"木",
			"日",
			"水"
		]
	},
	{
		grade: 3,
		semester: "upper",
		diff: 1,
		partA: "日",
		partB: "月",
		targetChar: "明",
		meaning: "光明、明亮（會意字）",
		pool: [
			"日",
			"月",
			"火",
			"土",
			"人",
			"心"
		]
	},
	{
		grade: 3,
		semester: "lower",
		diff: 2,
		partA: "人",
		partB: "木",
		targetChar: "休",
		meaning: "倚樹休息（會意字）",
		pool: [
			"人",
			"木",
			"口",
			"目",
			"手",
			"山"
		]
	},
	{
		grade: 4,
		semester: "upper",
		diff: 1,
		partA: "言",
		partB: "青",
		targetChar: "請",
		meaning: "禮貌請求（形聲字）",
		pool: [
			"言",
			"青",
			"氵",
			"心",
			"日",
			"木"
		]
	},
	{
		grade: 4,
		semester: "lower",
		diff: 2,
		partA: "氵",
		partB: "青",
		targetChar: "清",
		meaning: "清澈乾淨（形聲字）",
		pool: [
			"氵",
			"青",
			"日",
			"心",
			"口",
			"言"
		]
	},
	{
		grade: 5,
		semester: "upper",
		diff: 2,
		partA: "心",
		partB: "青",
		targetChar: "情",
		meaning: "情感心情（形聲字）",
		pool: [
			"心",
			"青",
			"氵",
			"言",
			"目",
			"火"
		]
	},
	{
		grade: 5,
		semester: "lower",
		diff: 3,
		partA: "門",
		partB: "耳",
		targetChar: "聞",
		meaning: "聽見、新聞（形聲字）",
		pool: [
			"門",
			"耳",
			"口",
			"日",
			"心",
			"木"
		]
	},
	{
		grade: 6,
		semester: "upper",
		diff: 2,
		partA: "山",
		partB: "石",
		targetChar: "岩",
		meaning: "高峻山石（會意字）",
		pool: [
			"山",
			"石",
			"土",
			"木",
			"火",
			"水"
		]
	},
	{
		grade: 6,
		semester: "lower",
		diff: 3,
		partA: "言",
		partB: "舌",
		targetChar: "話",
		meaning: "語言談話（形聲字）",
		pool: [
			"言",
			"舌",
			"口",
			"心",
			"耳",
			"手"
		]
	}
];
var EXTRA_ENGLISH_WORDS = [
	{
		grade: 1,
		semester: "upper",
		diff: 1,
		word: "Apple",
		zh: "蘋果",
		distractors: [
			"Ant",
			"Ball",
			"Cat"
		],
		tag: "水果單字"
	},
	{
		grade: 1,
		semester: "upper",
		diff: 1,
		word: "Cat",
		zh: "貓咪",
		distractors: [
			"Hat",
			"Bat",
			"Dog"
		],
		tag: "動物世界"
	},
	{
		grade: 1,
		semester: "upper",
		diff: 1,
		word: "Dog",
		zh: "小狗",
		distractors: [
			"Pig",
			"Frog",
			"Cat"
		],
		tag: "動物世界"
	},
	{
		grade: 1,
		semester: "lower",
		diff: 1,
		word: "Red",
		zh: "紅色",
		distractors: [
			"Bed",
			"Blue",
			"Green"
		],
		tag: "顏色單字"
	},
	{
		grade: 1,
		semester: "lower",
		diff: 1,
		word: "Book",
		zh: "書本",
		distractors: [
			"Look",
			"Pen",
			"Bag"
		],
		tag: "文具用品"
	},
	{
		grade: 1,
		semester: "lower",
		diff: 1,
		word: "Sun",
		zh: "太陽",
		distractors: [
			"Run",
			"Star",
			"Moon"
		],
		tag: "自然基礎"
	},
	{
		grade: 2,
		semester: "upper",
		diff: 1,
		word: "Banana",
		zh: "香蕉",
		distractors: [
			"Orange",
			"Mango",
			"Apple"
		],
		tag: "水果單字"
	},
	{
		grade: 2,
		semester: "upper",
		diff: 1,
		word: "Pencil",
		zh: "鉛筆",
		distractors: [
			"Ruler",
			"Eraser",
			"Paper"
		],
		tag: "文具用品"
	},
	{
		grade: 2,
		semester: "upper",
		diff: 1,
		word: "Happy",
		zh: "開心的",
		distractors: [
			"Angry",
			"Sleepy",
			"Hungry"
		],
		tag: "情緒形容"
	},
	{
		grade: 2,
		semester: "lower",
		diff: 1,
		word: "Water",
		zh: "水",
		distractors: [
			"Milk",
			"Juice",
			"Bread"
		],
		tag: "飲食單字"
	},
	{
		grade: 2,
		semester: "lower",
		diff: 1,
		word: "Tiger",
		zh: "老虎",
		distractors: [
			"Lion",
			"Panda",
			"Zebra"
		],
		tag: "動物世界"
	},
	{
		grade: 2,
		semester: "lower",
		diff: 2,
		word: "School",
		zh: "學校",
		distractors: [
			"Park",
			"Home",
			"Zoo"
		],
		tag: "校園地點"
	},
	{
		grade: 3,
		semester: "upper",
		diff: 1,
		word: "Sandwich",
		zh: "三明治",
		distractors: [
			"Sandwitch",
			"Sausage",
			"Salad"
		],
		tag: "飲食單字"
	},
	{
		grade: 3,
		semester: "upper",
		diff: 1,
		word: "Teacher",
		zh: "老師",
		distractors: [
			"Techer",
			"Trainer",
			"Toaster"
		],
		tag: "校園人物"
	},
	{
		grade: 3,
		semester: "upper",
		diff: 2,
		word: "Elephant",
		zh: "大象",
		distractors: [
			"Elefant",
			"Elevator",
			"Eggplant"
		],
		tag: "動物世界"
	},
	{
		grade: 3,
		semester: "lower",
		diff: 1,
		word: "Sunny",
		zh: "晴朗的",
		distractors: [
			"Funny",
			"Bunny",
			"Snowy"
		],
		tag: "天氣形容"
	},
	{
		grade: 3,
		semester: "lower",
		diff: 2,
		word: "Bicycle",
		zh: "腳踏車",
		distractors: [
			"Bicycel",
			"Circle",
			"Tricycle"
		],
		tag: "交通工具"
	},
	{
		grade: 3,
		semester: "lower",
		diff: 3,
		word: "Breakfast",
		zh: "早餐",
		distractors: [
			"Breakfirst",
			"Breathe",
			"Blanket"
		],
		tag: "日常作息"
	},
	{
		grade: 4,
		semester: "upper",
		diff: 1,
		word: "Hospital",
		zh: "醫院",
		distractors: [
			"Hospitel",
			"Hotel",
			"Hostel"
		],
		tag: "社區地點"
	},
	{
		grade: 4,
		semester: "upper",
		diff: 2,
		word: "Library",
		zh: "圖書館",
		distractors: [
			"Libary",
			"Liberty",
			"Lizard"
		],
		tag: "校園地點"
	},
	{
		grade: 4,
		semester: "upper",
		diff: 2,
		word: "Wednesday",
		zh: "星期三",
		distractors: [
			"Wensday",
			"Weekend",
			"Weather"
		],
		tag: "星期單字"
	},
	{
		grade: 4,
		semester: "lower",
		diff: 2,
		word: "Supermarket",
		zh: "超級市場",
		distractors: [
			"Supermaket",
			"Submarine",
			"Sunflower"
		],
		tag: "生活場所"
	},
	{
		grade: 4,
		semester: "lower",
		diff: 3,
		word: "Headache",
		zh: "頭痛",
		distractors: [
			"Headake",
			"Heartache",
			"Handbook"
		],
		tag: "健康身體"
	},
	{
		grade: 5,
		semester: "upper",
		diff: 2,
		word: "Astronaut",
		zh: "太空人",
		distractors: [
			"Astronot",
			"Asteroid",
			"Athlete"
		],
		tag: "夢想職業"
	},
	{
		grade: 5,
		semester: "upper",
		diff: 2,
		word: "Restaurant",
		zh: "餐廳",
		distractors: [
			"Resturant",
			"Restroom",
			"Resident"
		],
		tag: "城市生活"
	},
	{
		grade: 5,
		semester: "lower",
		diff: 2,
		word: "Mountain",
		zh: "高山",
		distractors: [
			"Mountian",
			"Fountain",
			"Curtain"
		],
		tag: "自然景觀"
	},
	{
		grade: 5,
		semester: "lower",
		diff: 3,
		word: "Yesterday",
		zh: "昨天",
		distractors: [
			"Yesturday",
			"Tomorrow",
			"Thursday"
		],
		tag: "過去時間"
	},
	{
		grade: 6,
		semester: "upper",
		diff: 2,
		word: "Environment",
		zh: "環境",
		distractors: [
			"Enviroment",
			"Equipment",
			"Excitement"
		],
		tag: "永續環保"
	},
	{
		grade: 6,
		semester: "upper",
		diff: 3,
		word: "Comfortable",
		zh: "舒適的",
		distractors: [
			"Comfertable",
			"Comparable",
			"Compatible"
		],
		tag: "進階形容詞"
	},
	{
		grade: 6,
		semester: "lower",
		diff: 2,
		word: "Celebration",
		zh: "慶祝活動",
		distractors: [
			"Celebrasion",
			"Collection",
			"Connection"
		],
		tag: "節慶文化"
	},
	{
		grade: 6,
		semester: "lower",
		diff: 3,
		word: "Experience",
		zh: "經驗／體驗",
		distractors: [
			"Experiance",
			"Experiment",
			"Expensive"
		],
		tag: "素養字彙"
	}
];
function buildExpandedChineseQuestions() {
	const res = [];
	EXTRA_CHINESE_SLASH.forEach((item, idx) => {
		res.push({
			id: `exp_zh_slash_${idx}`,
			grade: item.grade,
			semester: item.semester,
			subject: "chinese",
			type: "slash",
			prompt: item.prompt,
			answer: item.options[item.correctIndex],
			explanation: item.explanation,
			hint: `提示：關鍵知識點是「${item.tag}」。`,
			knowledgeTag: item.tag,
			difficulty: item.diff,
			payload: {
				mode: "slash",
				options: item.options,
				correctIndex: item.correctIndex
			}
		});
	});
	EXTRA_CHINESE_RADICALS.forEach((item, idx) => {
		res.push({
			id: `exp_zh_rad_${idx}`,
			grade: item.grade,
			semester: item.semester,
			subject: "chinese",
			type: "radical",
			prompt: `組合「${item.partA}」與正確部件，召喚代表「${item.meaning}」的漢字！`,
			answer: item.targetChar,
			explanation: `「${item.partA}」＋「${item.partB}」＝「${item.targetChar}」（${item.meaning}）。`,
			hint: `從偏旁池找出能和「${item.partA}」組合成「${item.targetChar}」的部件。`,
			knowledgeTag: "六書部首拆解",
			difficulty: item.diff,
			payload: {
				mode: "radical",
				partA: item.partA,
				partB: item.partB,
				pool: item.pool,
				targetChar: item.targetChar,
				meaning: item.meaning
			}
		});
	});
	[
		{
			grade: 1,
			semester: "upper",
			sentence: "今天天汽真好",
			typoIndex: 3,
			wrongChar: "汽",
			correctChar: "氣",
			tag: "形近字辨析"
		},
		{
			grade: 1,
			semester: "lower",
			sentence: "小狗在草地跑部",
			typoIndex: 6,
			wrongChar: "部",
			correctChar: "步",
			tag: "同音字辨析"
		},
		{
			grade: 2,
			semester: "upper",
			sentence: "我們一起去公園玩耍八",
			typoIndex: 9,
			wrongChar: "八",
			correctChar: "吧",
			tag: "語氣詞辨析"
		},
		{
			grade: 2,
			semester: "lower",
			sentence: "清早起來做早超",
			typoIndex: 6,
			wrongChar: "超",
			correctChar: "操",
			tag: "形近字辨析"
		}
	].forEach((t, idx) => {
		res.push({
			id: `exp_zh_typo_low_${idx}`,
			grade: t.grade,
			semester: t.semester,
			subject: "chinese",
			type: "typo",
			prompt: `火眼金睛抓錯字：請點出句子中寫錯的字！`,
			answer: t.correctChar,
			explanation: `句中的「${t.wrongChar}」應改為「${t.correctChar}」。`,
			hint: `仔細讀一次「${t.sentence}」，找出讀音相同但字形不對的字！`,
			knowledgeTag: t.tag,
			difficulty: 1,
			payload: {
				mode: "typo",
				sentence: t.sentence,
				typoIndex: t.typoIndex,
				wrongChar: t.wrongChar,
				correctChar: t.correctChar
			}
		});
	});
	return res;
}
function buildExpandedEnglishQuestions() {
	const res = [];
	EXTRA_ENGLISH_WORDS.forEach((item, idx) => {
		const pack = buildStringOptions(item.word, item.distractors);
		res.push({
			id: `exp_en_listen_${idx}`,
			grade: item.grade,
			semester: item.semester,
			subject: "english",
			type: "listen",
			prompt: `聽音辨字：精準鎖定「${item.zh}」的正確拼法戰機！`,
			answer: item.word,
			explanation: `正確拼法為 ${item.word}（${item.zh}），注意別被相似拼字干擾項欺騙！`,
			hint: `開頭字母是 ${item.word[0]}，共有 ${item.word.length} 個字母。`,
			knowledgeTag: item.tag,
			difficulty: item.diff,
			payload: {
				mode: "listen",
				speakText: item.word,
				zhMeaning: item.zh,
				choices: pack.options,
				correctIndex: pack.correctIndex
			}
		});
		if (item.grade <= 2 && item.word.length <= 6) res.push({
			id: `exp_en_spell_low_${idx}`,
			grade: item.grade,
			semester: item.semester,
			subject: "english",
			type: "spell",
			prompt: `母艦拼字任務：拼出「${item.zh}」的英文單字！`,
			answer: item.word.toUpperCase(),
			explanation: `${item.word} 的意思是「${item.zh}」。`,
			hint: `第一個字母是 ${item.word[0].toUpperCase()}！`,
			knowledgeTag: item.tag,
			difficulty: 1,
			payload: {
				mode: "spell",
				speakText: item.word,
				zhMeaning: item.zh,
				word: item.word.toUpperCase(),
				distractorLetters: [
					"Z",
					"Q",
					"X"
				]
			}
		});
	});
	return res;
}
function buildExpandedScienceQuestions() {
	return [
		{
			grade: 3,
			semester: "upper",
			diff: 1,
			dishName: "光合葉綠素濃湯",
			orderReq: "挑選植物行「光合作用」必備的 2 項原料＋中火＋中性純水",
			tag: "植物光合作用",
			explanation: "植物在陽光照射下吸收二氧化碳與水分，在葉綠體中製造養分並釋放氧氣。",
			temp: "simmer",
			tempLabel: "55°C 陽光中火",
			ph: "neutral",
			phLabel: "中性純水",
			fx: "nature",
			good: [
				"陽光能量",
				"二氧化碳",
				"葉綠素原料"
			],
			bad: [
				"塑膠微粒",
				"機油廢水",
				"非生物干擾"
			]
		},
		{
			grade: 4,
			semester: "upper",
			diff: 2,
			dishName: "超導銅線能量鍋",
			orderReq: "挑選 2 項「優良電導體」投入鍋中＋沸騰高火＋鹼性電解液",
			tag: "導體與絕緣體",
			explanation: "金屬如銅片、鐵釘含有自由電子，屬於良導體；塑膠與乾木棒為絕緣體。",
			temp: "boil",
			tempLabel: "100°C 電漿沸騰",
			ph: "alkali",
			phLabel: "鹼性電解液",
			fx: "fire",
			good: [
				"純銅線圈",
				"鐵釘導棒",
				"導電金屬"
			],
			bad: [
				"橡膠手套",
				"乾木筷子",
				"絕緣材質"
			]
		},
		{
			grade: 5,
			semester: "lower",
			diff: 2,
			dishName: "極地三態冰晶聖代",
			orderReq: "挑選 2 項讓水「凝固結冰／凝結」的關鍵條件＋急凍藍區＋中性水",
			tag: "水的三態變化",
			explanation: "水在 0°C 以下會凝固成冰，水蒸氣遇冷凝結成小水滴。",
			temp: "freeze",
			tempLabel: "0°C 急凍藍區",
			ph: "neutral",
			phLabel: "中性蒸餾水",
			fx: "ice",
			good: [
				"降溫至0°C",
				"冰塊冷凝",
				"三態凝結"
			],
			bad: [
				"猛火加熱",
				"曝曬高溫",
				"加速蒸發"
			]
		},
		{
			grade: 6,
			semester: "upper",
			diff: 3,
			dishName: "電磁極光檸檬凍",
			orderReq: "挑選 2 項能「增強電磁鐵磁力」的配料＋中火＋酸性檸檬指示劑",
			tag: "電磁鐵磁力",
			explanation: "增加線圈匝數與串聯更多電池都能顯著增強電磁鐵的磁力。",
			temp: "simmer",
			tempLabel: "55°C 穩定磁場",
			ph: "acid",
			phLabel: "酸性檸檬紅",
			fx: "rainbow",
			good: [
				"增加線圈數",
				"串聯雙電池",
				"增磁條件"
			],
			bad: [
				"拔除鐵芯",
				"改用塑膠線",
				"減弱磁力"
			]
		}
	].map((s, idx) => ({
		id: `exp_sci_dish_${idx}`,
		grade: s.grade,
		semester: s.semester,
		subject: "science",
		type: "dish",
		prompt: s.orderReq,
		answer: `${s.good[0]}＋${s.good[1]}`,
		explanation: s.explanation,
		hint: `觀察「${s.tag}」原理，選出 2 項正確科學條件！`,
		knowledgeTag: s.tag,
		difficulty: s.diff,
		payload: {
			dishName: s.dishName,
			orderRequirement: s.orderReq,
			neededCount: 2,
			targetTempZone: s.temp,
			targetTempLabel: s.tempLabel,
			targetPh: s.ph,
			targetPhLabel: s.phLabel,
			effectStyle: s.fx,
			ingredients: [
				{
					id: `g1_${idx}`,
					name: s.good[0],
					categoryTag: s.good[2],
					color: "#10B981",
					accent: "#6EE7B7",
					isCorrect: true
				},
				{
					id: `b1_${idx}`,
					name: s.bad[0],
					categoryTag: s.bad[2],
					color: "#64748B",
					accent: "#94A3B8",
					isCorrect: false,
					wrongReason: `「${s.bad[0]}」不符合${s.tag}需求！`
				},
				{
					id: `g2_${idx}`,
					name: s.good[1],
					categoryTag: s.good[2],
					color: "#F59E0B",
					accent: "#FDE68A",
					isCorrect: true
				},
				{
					id: `b2_${idx}`,
					name: s.bad[1],
					categoryTag: s.bad[2],
					color: "#EF4444",
					accent: "#FCA5A5",
					isCorrect: false,
					wrongReason: `「${s.bad[1]}」會導致實驗失敗！`
				}
			]
		}
	}));
}
// src/data/questionBank.ts
var EXPANDED_CHINESE = buildExpandedChineseQuestions();
var EXPANDED_ENGLISH = buildExpandedEnglishQuestions();
var EXPANDED_SCIENCE = buildExpandedScienceQuestions();
var SEEDED_PROCEDURAL_MATH = [
	...generateProceduralMathQuestions(1, "upper", 1, 14),
	...generateProceduralMathQuestions(1, "lower", 5, 14),
	...generateProceduralMathQuestions(2, "upper", 1, 14),
	...generateProceduralMathQuestions(2, "lower", 5, 14),
	...generateProceduralMathQuestions(3, "upper", 2, 16),
	...generateProceduralMathQuestions(3, "lower", 6, 16),
	...generateProceduralMathQuestions(4, "upper", 3, 18),
	...generateProceduralMathQuestions(4, "lower", 7, 18),
	...generateProceduralMathQuestions(5, "upper", 4, 18),
	...generateProceduralMathQuestions(5, "lower", 8, 18),
	...generateProceduralMathQuestions(6, "upper", 5, 18),
	...generateProceduralMathQuestions(6, "lower", 9, 18)
];
var CHINESE_QUESTIONS = [
	...CHINESE_QUESTIONS$1,
	...BONUS_CHINESE_QUESTIONS,
	...EPIC_CHINESE_QUESTIONS,
	...EXPANDED_CHINESE
];
var ENGLISH_QUESTIONS = [
	...ENGLISH_QUESTIONS$1,
	...BONUS_ENGLISH_QUESTIONS,
	...EPIC_ENGLISH_QUESTIONS,
	...EXPANDED_ENGLISH
];
var MATH_QUESTIONS = [
	...MATH_QUESTIONS$1,
	...BONUS_MATH_QUESTIONS,
	...EPIC_MATH_QUESTIONS,
	...SEEDED_PROCEDURAL_MATH
];
var SCIENCE_QUESTIONS = [
	...SCIENCE_QUESTIONS$1,
	...BONUS_SCIENCE_QUESTIONS,
	...EPIC_SCIENCE_QUESTIONS,
	...EXPANDED_SCIENCE
];
var ALL_QUESTIONS = [
	...CHINESE_QUESTIONS,
	...ENGLISH_QUESTIONS,
	...MATH_QUESTIONS,
	...SCIENCE_QUESTIONS
];
function shuffleArray(items) {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}
function getChineseQuestions(grade, semester, mode) {
	const byGrade = CHINESE_QUESTIONS.filter((q) => q.grade === grade && (!mode || q.type === mode));
	const exactSemester = byGrade.filter((q) => q.semester === semester);
	const othersInGrade = byGrade.filter((q) => q.semester !== semester);
	return [...shuffleArray(exactSemester), ...shuffleArray(othersInGrade)];
}
function getEnglishQuestions(grade, semester, mode) {
	const byGrade = ENGLISH_QUESTIONS.filter((q) => q.grade === grade && (!mode || q.type === mode));
	const exactSemester = byGrade.filter((q) => q.semester === semester);
	const othersInGrade = byGrade.filter((q) => q.semester !== semester);
	return [...shuffleArray(exactSemester), ...shuffleArray(othersInGrade)];
}
function getMathQuestions(grade, semester, stageNumber = 5) {
	const freshDynamic = generateProceduralMathQuestions(grade, semester, stageNumber, 18);
	const byGrade = MATH_QUESTIONS.filter((q) => q.grade === grade);
	const exactSemester = byGrade.filter((q) => q.semester === semester);
	const othersInGrade = byGrade.filter((q) => q.semester !== semester);
	return [
		...shuffleArray(freshDynamic),
		...shuffleArray(exactSemester),
		...shuffleArray(othersInGrade)
	];
}
function getScienceQuestions(grade, semester) {
	const effectiveGrade = grade < 3 ? 3 : grade;
	const byGrade = SCIENCE_QUESTIONS.filter((q) => q.grade === effectiveGrade);
	const exactSemester = byGrade.filter((q) => q.semester === semester);
	const othersInGrade = byGrade.filter((q) => q.semester !== semester);
	return [...shuffleArray(exactSemester), ...shuffleArray(othersInGrade)];
}
// src/core/questionManager.ts
/**
* Zero-Repeat QuestionManager
* Guarantees that within a single battle run (and across consecutive pulls in a chapter),
* the same question will NEVER appear twice until the entire fresh pool is exhausted,
* and even on deck recycle, the last asked question is strictly prevented from repeating back-to-back.
* Priority order:
*   1. Active Wrong Notebook questions (targeted review)
*   2. Unseen / unmastered questions matching stage focusTags
*   3. Unseen / unmastered questions in same grade & semester
*   4. Previously mastered questions (shuffled)
*/
var SHUFFLE_BAG_PREFIX = "zhiguang_shuffle_bag_v1_";
function readPersistedBag(bagKey) {
	if (!bagKey || typeof globalThis === "undefined" || !("localStorage" in globalThis)) return [];
	try {
		const raw = globalThis.localStorage.getItem(SHUFFLE_BAG_PREFIX + bagKey);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
	} catch {
		return [];
	}
}
function writePersistedBag(bagKey, ids) {
	if (!bagKey || typeof globalThis === "undefined" || !("localStorage" in globalThis)) return;
	try {
		globalThis.localStorage.setItem(SHUFFLE_BAG_PREFIX + bagKey, JSON.stringify(Array.from(ids).slice(-400)));
	} catch {}
}
var QuestionManager = class {
	constructor(pool, options) {
		this.usedInRun = /* @__PURE__ */ new Set();
		this.queue = [];
		this.lastServedId = null;
		const seen = /* @__PURE__ */ new Set();
		this.allPool = pool.filter((q) => {
			if (seen.has(q.id)) return false;
			seen.add(q.id);
			return true;
		});
		this.wrongIdSet = new Set(options?.wrongQuestionIds ?? []);
		this.masteredIdSet = new Set(options?.masteredQuestionIds ?? []);
		this.focusTags = options?.focusTags ?? [];
		this.bagKey = options?.bagKey;
		for (const id of readPersistedBag(this.bagKey)) if (seen.has(id)) this.usedInRun.add(id);
		if (this.usedInRun.size >= this.allPool.length && this.allPool.length > 0) {
			this.usedInRun.clear();
			writePersistedBag(this.bagKey, this.usedInRun);
		}
		this.rebuildQueue(false);
	}
	matchesFocus(q) {
		if (this.focusTags.length === 0) return false;
		return this.focusTags.some((tag) => q.knowledgeTag.includes(tag) || tag.includes(q.knowledgeTag));
	}
	rebuildQueue(allowUsedRecycle) {
		const candidates = allowUsedRecycle ? [...this.allPool] : this.allPool.filter((q) => !this.usedInRun.has(q.id));
		const wrongBucket = [];
		const focusUnmastered = [];
		const generalUnmastered = [];
		const masteredBucket = [];
		for (const q of candidates) if (this.wrongIdSet.has(q.id)) wrongBucket.push(q);
		else if (!this.masteredIdSet.has(q.id)) {
			if (this.matchesFocus(q)) focusUnmastered.push(q);
			else generalUnmastered.push(q);
		} else masteredBucket.push(q);
		const ordered = [
			...shuffleArray(wrongBucket),
			...shuffleArray(focusUnmastered),
			...shuffleArray(generalUnmastered),
			...shuffleArray(masteredBucket)
		];
		if (ordered.length > 1 && this.lastServedId && ordered[0].id === this.lastServedId) {
			const swapIdx = ordered.findIndex((q) => q.id !== this.lastServedId);
			if (swapIdx > 0) {
				const [picked] = ordered.splice(swapIdx, 1);
				ordered.unshift(picked);
			}
		}
		this.queue = ordered;
	}
	/**
	* Pull the next non-repeating question. Optional predicate lets engines pull
	* e.g. a specific sub-mode ('radical' | 'typo' | 'spell') without duplicating IDs.
	*/
	next(predicate) {
		if (this.allPool.length === 0) throw new Error("QuestionManager initialized with an empty pool");
		const findIndexInQueue = () => predicate ? this.queue.findIndex(predicate) : this.queue.length > 0 ? 0 : -1;
		let idx = findIndexInQueue();
		if (idx === -1) {
			this.usedInRun.clear();
			writePersistedBag(this.bagKey, this.usedInRun);
			this.rebuildQueue(true);
			idx = findIndexInQueue();
		}
		if (idx === -1) idx = 0;
		const [picked] = this.queue.splice(idx, 1);
		this.usedInRun.add(picked.id);
		this.lastServedId = picked.id;
		writePersistedBag(this.bagKey, this.usedInRun);
		return picked;
	}
	getRemainingFreshCount() {
		return Math.max(0, this.allPool.length - this.usedInRun.size);
	}
	getUniqueServedCount() {
		return this.usedInRun.size;
	}
};
// src/data/campaignMap.ts
var CHAPTER_TEMPLATES = {
	chinese: [
		{
			chapterIndex: 1,
			title: "第一章・墨溪古道",
			unitSummary: "部首結構、形近字辨識與詞語配對基礎",
			themeColor: "#F59E0B",
			bossName: "亂碼魔將軍",
			bossPhase2Name: "狂墨・亂碼魔將軍【二階】",
			elitePairName: "錯字波利＆形近雙煞",
			focusTags: [
				"部首結構",
				"形近字",
				"字音字形",
				"部首拼字"
			],
			stageTitles: [
				"墨溪初探",
				"偏旁石碑林",
				"青竹書院門",
				"形近字迷霧",
				"多音字渡口",
				"古籍拼字陣",
				"雙煞守橋戰",
				"墨林大亂鬥",
				"飛花連擊道",
				"亂碼魔將軍殿"
			],
			chestWeaponId: "star_lance",
			chestLabel: "星輝脈衝長槍＋升階晶石 ×8"
		},
		{
			chapterIndex: 2,
			title: "第二章・成語仙山",
			unitSummary: "成語活用、修辭技巧與標點語病診斷",
			themeColor: "#EC4899",
			bossName: "病句妖王",
			bossPhase2Name: "斷章・病句妖王【二階】",
			elitePairName: "誇飾狐＆譬喻鴉",
			focusTags: [
				"成語活用",
				"修辭手法",
				"病句修改",
				"成語典故"
			],
			stageTitles: [
				"山腳成語碑",
				"四字試煉階",
				"譬喻雲海亭",
				"擬人竹林陣",
				"對偶懸索橋",
				"病句除魔壇",
				"雙妖護法陣",
				"詞海狂潮戰",
				"妙筆生花道",
				"病句妖王神殿"
			],
			chestWeaponId: "golden_ratio_staff",
			chestLabel: "黃金比例裁決杖＋升階晶石 ×10"
		},
		{
			chapterIndex: 3,
			title: "第三章・文昌星閣",
			unitSummary: "古詩賞析、文言文關鍵字與閱讀推論",
			themeColor: "#A855F7",
			bossName: "絕墨天尊",
			bossPhase2Name: "虛空・絕墨天尊【二階】",
			elitePairName: "忘詩鬼＆斷簡魔",
			focusTags: [
				"古詩賞析",
				"文言詞義",
				"閱讀推論",
				"經典名句"
			],
			stageTitles: [
				"星閣迎風廊",
				"絕句平仄臺",
				"古詩意境橋",
				"文言解碼室",
				"名言典故塔",
				"修辭星象儀",
				"雙魔鎮閣戰",
				"群書激鬥廳",
				"翰林連斬陣",
				"絕墨天尊頂樓"
			],
			chestWeaponId: "academy_blade",
			chestLabel: "傳說文華晶核＋升階晶石 ×12"
		}
	],
	english: [
		{
			chapterIndex: 1,
			title: "Chapter 1・霓虹星港",
			unitSummary: "日常生活單字、聽音辨字與自然發音",
			themeColor: "#06B6D4",
			bossName: "靜默母艦 Alpha",
			bossPhase2Name: "超載・靜默母艦【二階】",
			elitePairName: "雙子干擾無人機",
			focusTags: [
				"生活單字",
				"天氣食物",
				"自然發音",
				"聽力辨字"
			],
			stageTitles: [
				"星港啟航",
				"霓虹單字帶",
				"氣象雷達區",
				"校園通訊塔",
				"音標隕石群",
				"雙語干擾網",
				"雙子艦守衛戰",
				"極速單字潮",
				"光束連擊軌",
				"靜默母艦決戰"
			],
			chestWeaponId: "star_lance",
			chestLabel: "星輝脈衝長槍＋升階晶石 ×8"
		},
		{
			chapterIndex: 2,
			title: "Chapter 2・文法蟲洞",
			unitSummary: "疑問詞、時態文法與對話填空實戰",
			themeColor: "#6366F1",
			bossName: "錯序星艦 Omega",
			bossPhase2Name: "時空・錯序星艦【二階】",
			elitePairName: "過去式＆進行式戰機",
			focusTags: [
				"基礎文法",
				"時態變化",
				"生活對話",
				"疑問詞"
			],
			stageTitles: [
				"蟲洞入口",
				"Be動詞航道",
				"疑問詞星雲",
				"進行式脈衝",
				"過去式殘骸",
				"介系詞雷區",
				"時態雙王戰",
				"銀河句型暴",
				"超光速連擊",
				"錯序星艦核心"
			],
			chestWeaponId: "golden_ratio_staff",
			chestLabel: "黃金比例裁決杖＋升階晶石 ×10"
		},
		{
			chapterIndex: 3,
			title: "Chapter 3・星核語宮",
			unitSummary: "長句理解、職業興趣與高頻拼字挑戰",
			themeColor: "#D946EF",
			bossName: "虛空語皇母艦",
			bossPhase2Name: "毀滅・虛空語皇【二階】",
			elitePairName: "拼字雙核心母機",
			focusTags: [
				"高頻拼字",
				"職業興趣",
				"節慶文化",
				"閱讀填空"
			],
			stageTitles: [
				"星宮外環",
				"拼字光橋",
				"夢想職業站",
				"世界節慶帶",
				"旅遊對話港",
				"星際拼寫爐",
				"雙核護衛陣",
				"全頻單字海",
				"星河極限擊",
				"虛空語皇王座"
			],
			chestWeaponId: "academy_blade",
			chestLabel: "星語傳說晶核＋升階晶石 ×12"
		}
	],
	math: [
		{
			chapterIndex: 1,
			title: "第一章・四則草坪堡",
			unitSummary: "加減乘除運算、括號優先與估算巧算",
			themeColor: "#3B82F6",
			bossName: "零之巨像",
			bossPhase2Name: "暴走・零之巨像【二階】",
			elitePairName: "鐵桶負數＆跳跳算式雙將",
			focusTags: [
				"四則運算",
				"整數乘除",
				"估算心算",
				"括號順序"
			],
			stageTitles: [
				"堡前初防",
				"齒輪採集站",
				"乘法狙擊線",
				"除法破甲陣",
				"括號優先橋",
				"複合算式牆",
				"雙將強襲戰",
				"算式狂潮防線",
				"黃金超頻陣",
				"零之巨像攻城"
			],
			chestWeaponId: "star_lance",
			chestLabel: "星輝脈衝長槍＋升階晶石 ×8"
		},
		{
			chapterIndex: 2,
			title: "第二章・分數幾何塔",
			unitSummary: "分數加減通分、小數運算與周長面積",
			themeColor: "#0EA5E9",
			bossName: "碎裂幾何王",
			bossPhase2Name: "高維・碎裂幾何王【二階】",
			elitePairName: "分數騎士＆面積盾衛",
			focusTags: [
				"分數運算",
				"小數加減",
				"面積周長",
				"因數倍數"
			],
			stageTitles: [
				"分數溪谷",
				"通分石磚牆",
				"小數點吊橋",
				"長方形堡壘",
				"三角形尖塔",
				"因倍數地雷",
				"幾何雙衛戰",
				"百變圖形潮",
				"精準座標砲",
				"碎裂幾何王座"
			],
			chestWeaponId: "golden_ratio_staff",
			chestLabel: "黃金比例裁決杖＋升階晶石 ×10"
		},
		{
			chapterIndex: 3,
			title: "第三章・比例星儀城",
			unitSummary: "速率、比與比值、圓面積與未知數應用",
			themeColor: "#14B8A6",
			bossName: "混沌公式帝",
			bossPhase2Name: "無限・混沌公式帝【二階】",
			elitePairName: "速率飛將＆未知數魔盾",
			focusTags: [
				"速率問題",
				"比與比值",
				"圓面積",
				"未知數"
			],
			stageTitles: [
				"星儀大門",
				"百分率鐘樓",
				"比值天平橋",
				"速率軌道線",
				"圓周率砲台",
				"柱體容積庫",
				"雙魔公式陣",
				"全能算式海",
				"超頻軌道轟",
				"混沌公式帝殿"
			],
			chestWeaponId: "academy_blade",
			chestLabel: "數律傳說晶核＋升階晶石 ×12"
		}
	],
	science: [
		{
			chapterIndex: 1,
			title: "第一章・元素暖火灶",
			unitSummary: "物質三態變化、溶解現象與植物構造",
			themeColor: "#10B981",
			bossName: "黑暗饕餮王",
			bossPhase2Name: "暴食・黑暗饕餮王【二階】",
			elitePairName: "冰火雙醬怪",
			focusTags: [
				"水的三態",
				"溶解實驗",
				"植物構造",
				"熱脹冷縮"
			],
			stageTitles: [
				"暖火開張",
				"三態魔法鍋",
				"根莖葉冷櫃",
				"溶解結晶湯",
				"蒸發冷凝盅",
				"熱對流快炒",
				"冰火雙怪試吃",
				"極限翻鍋祭",
				"元素連擊宴",
				"黑暗饕餮王宴"
			],
			chestWeaponId: "star_lance",
			chestLabel: "星輝脈衝長槍＋升階晶石 ×8"
		},
		{
			chapterIndex: 2,
			title: "第二章・酸鹼星廚館",
			unitSummary: "水溶液酸鹼變色、電路磁鐵與光影折射",
			themeColor: "#F97316",
			bossName: "失衡酸鹼魔廚",
			bossPhase2Name: "腐蝕・酸鹼魔廚【二階】",
			elitePairName: "強酸史萊姆＆磁場火龍",
			focusTags: [
				"水溶液酸鹼",
				"電路與磁鐵",
				"光的折射",
				"聲波震動"
			],
			stageTitles: [
				"紫菜汁調色",
				"石蕊試紙台",
				"磁極懸浮爐",
				"串並聯電鍋",
				"彩虹折射飲",
				"氧化防鏽派",
				"酸磁雙魔踢館",
				"元素彩虹狂炒",
				"精準溫控秀",
				"失衡魔廚決戰"
			],
			chestWeaponId: "golden_ratio_staff",
			chestLabel: "黃金比例裁決杖＋升階晶石 ×10"
		},
		{
			chapterIndex: 3,
			title: "第三章・生態宇宙宴",
			unitSummary: "天文月相四季、地質天氣、電磁鐵與生態鏈",
			themeColor: "#EF4444",
			bossName: "混沌熵滅巨饕",
			bossPhase2Name: "黑洞・熵滅巨饕【二階】",
			elitePairName: "颱風旋風怪＆板塊石饕",
			focusTags: [
				"天文月相",
				"天氣與地質",
				"電磁鐵",
				"生態食物鏈"
			],
			stageTitles: [
				"月相盈虧餅",
				"星象四季湯",
				"鋒面雲霧鍋",
				"電磁線圈烤",
				"槓桿省力燉",
				"岩石礦物拼",
				"風岩雙饕來襲",
				"全能實驗大賽",
				"黃金星廚連擊",
				"混沌熵滅最終宴"
			],
			chestWeaponId: "academy_blade",
			chestLabel: "森羅傳說晶核＋升階晶石 ×12"
		}
	]
};
function getStageTier(stageNumber) {
	if (stageNumber <= 3) return "explore";
	if (stageNumber <= 6) return "trial";
	if (stageNumber === 7) return "elite";
	if (stageNumber <= 9) return "brawl";
	return "boss";
}
function buildStageKey(subject, grade, chapterIndex, stageNumber) {
	return `${subject}_g${grade}_c${chapterIndex}_s${stageNumber}`;
}
function getChaptersForWorld(subject, grade) {
	return CHAPTER_TEMPLATES[subject].map((tpl) => {
		const stages = tpl.stageTitles.map((stageTitle, idx) => {
			const stageNumber = idx + 1;
			const tier = getStageTier(stageNumber);
			const chapterFactor = 1 + (tpl.chapterIndex - 1) * .16;
			const stageFactor = 1 + (stageNumber - 1) * .08;
			const enemyHpScale = Number((chapterFactor * stageFactor * (tier === "boss" ? 1.45 : tier === "elite" ? 1.2 : 1)).toFixed(2));
			const enemySpeedScale = Number((1 + (tpl.chapterIndex - 1) * .08 + (stageNumber - 1) * .04).toFixed(2));
			const waveCount = tier === "explore" ? 3 : tier === "trial" ? 4 : tier === "elite" ? 4 : tier === "brawl" ? 5 : 5;
			const comboRewardMultiplier = tier === "brawl" || tier === "boss" ? 2 : tier === "elite" ? 1.5 : 1;
			const enemyName = tier === "boss" ? tpl.bossName : tier === "elite" ? tpl.elitePairName : tier === "brawl" ? `${stageTitle}軍團` : `${stageTitle}守衛`;
			const subtitle = tier === "explore" ? "熟悉專屬操作與基礎 108 課綱核心概念" : tier === "trial" ? "進階題型與特殊機制登場，精準破防！" : tier === "elite" ? `雙精英聯手登場（${tpl.elitePairName}），限時破盾挑戰！` : tier === "brawl" ? "全章節知識點綜合亂鬥・連擊獎勵翻倍！" : `巨型 Boss【${tpl.bossName}】2 階段狂暴變身・三星通關奪寶箱！`;
			return {
				stageKey: buildStageKey(subject, grade, tpl.chapterIndex, stageNumber),
				subject,
				grade,
				chapterIndex: tpl.chapterIndex,
				chapterTitle: tpl.title,
				stageNumber,
				title: stageTitle,
				subtitle,
				tier,
				enemyName,
				bossPhase2Name: tier === "boss" ? tpl.bossPhase2Name : void 0,
				enemyHpScale,
				enemySpeedScale,
				waveCount,
				comboRewardMultiplier,
				focusTags: tpl.focusTags,
				starChestReward: tier === "boss" ? {
					coins: 260 + tpl.chapterIndex * 80,
					crystals: 6 + tpl.chapterIndex * 2,
					weaponTemplateId: tpl.chestWeaponId,
					label: tpl.chestLabel
				} : void 0
			};
		});
		return {
			id: `${subject}_g${grade}_c${tpl.chapterIndex}`,
			subject,
			grade,
			chapterIndex: tpl.chapterIndex,
			title: tpl.title,
			unitSummary: tpl.unitSummary,
			themeColor: tpl.themeColor,
			bossName: tpl.bossName,
			stages
		};
	});
}
function getStageConfig(subject, grade, chapterIndex, stageNumber) {
	const chapters = getChaptersForWorld(subject, grade);
	const ch = chapters[chapterIndex - 1] ?? chapters[0];
	return ch.stages[Math.max(0, Math.min(9, stageNumber - 1))] ?? ch.stages[0];
}
function isStageUnlocked(stage, progress) {
	if (stage.chapterIndex === 1 && stage.stageNumber === 1) return true;
	if (!progress) return false;
	if (stage.stageNumber > 1) {
		const prevKey = buildStageKey(stage.subject, stage.grade, stage.chapterIndex, stage.stageNumber - 1);
		return Boolean(progress[prevKey]?.cleared);
	}
	const prevChapter = stage.chapterIndex - 1;
	const prevBossKey = buildStageKey(stage.subject, stage.grade, prevChapter, 10);
	return Boolean(progress[prevBossKey]?.cleared);
}
function getWorldTotalStars(subject, grade, progress) {
	const chapters = getChaptersForWorld(subject, grade);
	let earned = 0;
	let clearedStages = 0;
	for (const ch of chapters) for (const s of ch.stages) {
		const rec = progress?.[s.stageKey];
		if (rec?.cleared) clearedStages += 1;
		earned += rec?.stars ?? 0;
	}
	return {
		earned,
		max: 90,
		clearedStages
	};
}
// src/types/progression.ts
function createInitialMandarinTree() {
	return {
		chi_phonetics_1: {
			nodeId: "chi_phonetics_1",
			branch: "字音字形",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		chi_phonetics_2: {
			nodeId: "chi_phonetics_2",
			branch: "字音字形",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		chi_idiom_1: {
			nodeId: "chi_idiom_1",
			branch: "詞語成語",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		chi_idiom_2: {
			nodeId: "chi_idiom_2",
			branch: "詞語成語",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		chi_reading_1: {
			nodeId: "chi_reading_1",
			branch: "閱讀理解",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		chi_reading_2: {
			nodeId: "chi_reading_2",
			branch: "閱讀理解",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		chi_rhetoric_1: {
			nodeId: "chi_rhetoric_1",
			branch: "修辭寫作",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		chi_rhetoric_2: {
			nodeId: "chi_rhetoric_2",
			branch: "修辭寫作",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		}
	};
}
function createInitialMathTree() {
	return {
		math_calc_1: {
			nodeId: "math_calc_1",
			branch: "數與計算",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		math_calc_2: {
			nodeId: "math_calc_2",
			branch: "數與計算",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		math_geo_1: {
			nodeId: "math_geo_1",
			branch: "幾何與空間",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		math_geo_2: {
			nodeId: "math_geo_2",
			branch: "幾何與空間",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		math_measure_1: {
			nodeId: "math_measure_1",
			branch: "量與實測",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		math_measure_2: {
			nodeId: "math_measure_2",
			branch: "量與實測",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		math_algebra_1: {
			nodeId: "math_algebra_1",
			branch: "代數與應用邏輯",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		math_algebra_2: {
			nodeId: "math_algebra_2",
			branch: "代數與應用邏輯",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		}
	};
}
function createInitialScienceTree() {
	return {
		sci_matter_1: {
			nodeId: "sci_matter_1",
			branch: "物質與變化",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		sci_matter_2: {
			nodeId: "sci_matter_2",
			branch: "物質與變化",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		sci_bio_1: {
			nodeId: "sci_bio_1",
			branch: "生物與生態",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		sci_bio_2: {
			nodeId: "sci_bio_2",
			branch: "生物與生態",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		sci_earth_1: {
			nodeId: "sci_earth_1",
			branch: "地球與環境",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		sci_earth_2: {
			nodeId: "sci_earth_2",
			branch: "地球與環境",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		sci_energy_1: {
			nodeId: "sci_energy_1",
			branch: "能量與力",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		},
		sci_energy_2: {
			nodeId: "sci_energy_2",
			branch: "能量與力",
			level: 0,
			maxLevel: 5,
			contributingTags: []
		}
	};
}
function createInitialSubjectProfiles() {
	return {
		chinese: {
			characterTitle: "見習書童",
			rpgLevel: 1,
			exp: 0,
			skillPoints: 2,
			equippedWeaponId: "chi_wp_brush",
			unlockedWeaponIds: ["chi_wp_brush"],
			equippedArmorId: "chi_ar_scroll_cloak",
			unlockedArmorIds: ["chi_ar_scroll_cloak"],
			socketedGemIds: ["gem_wenxin_ink"],
			consumables: {
				ink_inspiration: 3,
				calm_elixir: 2,
				double_aura_talisman: 2
			},
			guardianSpiritId: "spirit_zi_ling",
			growthTree: createInitialMandarinTree()
		},
		english: {
			pilotRank: "見習領航員",
			flightMiles: 0,
			hangarCores: 40,
			activeJetId: "jet_sparrow",
			unlockedJetIds: ["jet_sparrow"],
			unlockedModuleIds: [
				"wing_standard",
				"pod_dual_laser",
				"chip_deflector"
			],
			loadout: {
				wingModuleId: "wing_standard",
				weaponPodId: "pod_dual_laser",
				avionicsChipId: "chip_deflector"
			},
			tacticalItems: {
				repair_drone: 2,
				chrono_field: 2,
				voice_beacon: 3
			},
			copilotSpiritId: "ai_echo7"
		},
		math: {
			commanderRank: "初階算術工程師",
			techGears: 2,
			turretUpgrades: {
				turret_addsub: 1,
				turret_muldiv: 1,
				turret_geo_frost: 1,
				turret_frac_mortar: 1
			},
			activeDeckTurretIds: [
				"turret_addsub",
				"turret_muldiv",
				"turret_geo_frost",
				"turret_frac_mortar"
			],
			tacticalTraps: {
				nitrogen_bomb: 2,
				overclock_core: 2,
				bastion_wrench: 2
			},
			guardianSpiritId: "spirit_archi",
			growthTree: createInitialMathTree()
		},
		science: {
			chefTitle: "見習實驗小廚",
			labCrystals: 2,
			equippedCookwareId: "cook_induction",
			unlockedCookwareIds: ["cook_induction", "cook_beaker_set"],
			seasoningInventory: {
				heat_stabilizer: 2,
				golden_sauce: 2,
				lab_hourglass: 2
			},
			foodSpiritId: "spirit_flame_chef",
			growthTree: createInitialScienceTree()
		}
	};
}
function mergeTree(baseTree, incoming) {
	if (!incoming || typeof incoming !== "object") return baseTree;
	const merged = {};
	for (const [key, def] of Object.entries(baseTree)) {
		const raw = incoming[key];
		if (raw && typeof raw === "object") merged[key] = {
			...def,
			...raw,
			level: Math.max(0, Math.min(def.maxLevel, Number(raw.level) || 0)),
			contributingTags: Array.isArray(raw.contributingTags) ? raw.contributingTags : []
		};
		else merged[key] = def;
	}
	return merged;
}
/**
* Lossless migration from legacy single-hero PlayerSaveData to independent 4-subject profiles.
* Converts historical progress into subject-specific starter points without wiping legacy fields.
*/
function migrateLegacySaveToSubjectProfiles(legacySave) {
	const base = createInitialSubjectProfiles();
	if (!legacySave) return base;
	const existing = legacySave.subjectProfiles;
	const chineseStats = legacySave.subjectStats?.chinese;
	const englishStats = legacySave.subjectStats?.english;
	const mathStats = legacySave.subjectStats?.math;
	const scienceStats = legacySave.subjectStats?.science;
	if (existing && (existing.chinese || existing.english || existing.math || existing.science)) return {
		chinese: {
			...base.chinese,
			...existing.chinese || {},
			unlockedWeaponIds: Array.isArray(existing.chinese?.unlockedWeaponIds) && existing.chinese.unlockedWeaponIds.length > 0 ? Array.from(new Set(existing.chinese.unlockedWeaponIds)) : base.chinese.unlockedWeaponIds,
			unlockedArmorIds: Array.isArray(existing.chinese?.unlockedArmorIds) && existing.chinese.unlockedArmorIds.length > 0 ? Array.from(new Set(existing.chinese.unlockedArmorIds)) : base.chinese.unlockedArmorIds,
			socketedGemIds: Array.isArray(existing.chinese?.socketedGemIds) ? existing.chinese.socketedGemIds : base.chinese.socketedGemIds,
			consumables: {
				...base.chinese.consumables,
				...existing.chinese?.consumables || {}
			},
			growthTree: mergeTree(base.chinese.growthTree, existing.chinese?.growthTree)
		},
		english: {
			...base.english,
			...existing.english || {},
			unlockedJetIds: Array.isArray(existing.english?.unlockedJetIds) && existing.english.unlockedJetIds.length > 0 ? Array.from(new Set(existing.english.unlockedJetIds)) : base.english.unlockedJetIds,
			unlockedModuleIds: Array.isArray(existing.english?.unlockedModuleIds) && existing.english.unlockedModuleIds.length > 0 ? Array.from(new Set(existing.english.unlockedModuleIds)) : base.english.unlockedModuleIds,
			loadout: {
				...base.english.loadout,
				...existing.english?.loadout || {}
			},
			tacticalItems: {
				...base.english.tacticalItems,
				...existing.english?.tacticalItems || {}
			}
		},
		math: {
			...base.math,
			...existing.math || {},
			turretUpgrades: {
				...base.math.turretUpgrades,
				...existing.math?.turretUpgrades || {}
			},
			activeDeckTurretIds: Array.isArray(existing.math?.activeDeckTurretIds) && existing.math.activeDeckTurretIds.length > 0 ? existing.math.activeDeckTurretIds : base.math.activeDeckTurretIds,
			tacticalTraps: {
				...base.math.tacticalTraps,
				...existing.math?.tacticalTraps || {}
			},
			growthTree: mergeTree(base.math.growthTree, existing.math?.growthTree)
		},
		science: {
			...base.science,
			...existing.science || {},
			unlockedCookwareIds: Array.isArray(existing.science?.unlockedCookwareIds) && existing.science.unlockedCookwareIds.length > 0 ? Array.from(new Set(existing.science.unlockedCookwareIds)) : base.science.unlockedCookwareIds,
			seasoningInventory: {
				...base.science.seasoningInventory,
				...existing.science?.seasoningInventory || {}
			},
			growthTree: mergeTree(base.science.growthTree, existing.science?.growthTree)
		}
	};
	const legacyLevel = Math.max(1, Number(legacySave.level) || 1);
	const chiCorrect = Math.max(0, Number(chineseStats?.correct) || 0);
	const engCorrect = Math.max(0, Number(englishStats?.correct) || 0);
	const mathCorrect = Math.max(0, Number(mathStats?.correct) || 0);
	const sciCorrect = Math.max(0, Number(scienceStats?.correct) || 0);
	const chiSkillPoints = base.chinese.skillPoints + Math.floor(chiCorrect / 4) + Math.floor((legacyLevel - 1) / 3);
	const engCores = base.english.hangarCores + engCorrect * 8 + (englishStats?.clears ?? 0) * 20;
	const mathGears = base.math.techGears + Math.floor(mathCorrect / 4) + (mathStats?.clears ?? 0);
	const sciCrystals = base.science.labCrystals + Math.floor(sciCorrect / 4) + (scienceStats?.clears ?? 0);
	return {
		chinese: {
			...base.chinese,
			rpgLevel: Math.max(1, 1 + Math.floor(chiCorrect / 5) + Math.floor((legacyLevel - 1) / 2)),
			exp: chiCorrect % 5 * 20,
			skillPoints: chiSkillPoints,
			consumables: {
				ink_inspiration: base.chinese.consumables.ink_inspiration + Math.min(3, legacySave.items?.wisdom_potion ?? 0),
				calm_elixir: base.chinese.consumables.calm_elixir + Math.min(3, legacySave.items?.shield_scroll ?? 0),
				double_aura_talisman: base.chinese.consumables.double_aura_talisman + Math.min(3, legacySave.items?.combo_charm ?? 0)
			}
		},
		english: {
			...base.english,
			flightMiles: engCorrect * 120 + (englishStats?.clears ?? 0) * 450,
			hangarCores: engCores,
			pilotRank: engCorrect >= 30 ? "星際王牌飛官" : engCorrect >= 12 ? "音速中隊長" : "見習領航員",
			tacticalItems: {
				repair_drone: base.english.tacticalItems.repair_drone + Math.min(3, legacySave.items?.shield_scroll ?? 0),
				chrono_field: base.english.tacticalItems.chrono_field + Math.min(3, legacySave.items?.time_hourglass ?? 0),
				voice_beacon: base.english.tacticalItems.voice_beacon + Math.min(3, legacySave.items?.wisdom_potion ?? 0)
			}
		},
		math: {
			...base.math,
			techGears: mathGears,
			commanderRank: mathCorrect >= 30 ? "首席數理總工程師" : mathCorrect >= 12 ? "防線結構技師" : "初階算術工程師"
		},
		science: {
			...base.science,
			labCrystals: sciCrystals,
			chefTitle: sciCorrect >= 30 ? "星級元素實驗主廚" : sciCorrect >= 12 ? "精密調味研究員" : "見習實驗小廚"
		}
	};
}
// src/data/subjectProgressionData.ts
var ENGLISH_JETS = [
	{
		id: "jet_sparrow",
		name: "星隼一型偵察機",
		codeName: "SF-01 SPARROW",
		liveryColor: "#38BDF8",
		accentColor: "#E0F2FE",
		description: "均衡型學園訓練戰機，操控穩定，適合熟悉聽音鎖定與單字狙擊。",
		unlockCores: 0,
		baseFirepower: 52,
		baseShield: 54,
		baseMobility: 60,
		baseLockOn: 58
	},
	{
		id: "jet_falcon",
		name: "音速遊隼 Mk-II",
		codeName: "VF-22 FALCON",
		liveryColor: "#0EA5E9",
		accentColor: "#FDE047",
		description: "高機動截擊機，搭載雙向量尾噴嘴，快速穿梭於單字彈幕之間。",
		unlockCores: 60,
		baseFirepower: 68,
		baseShield: 58,
		baseMobility: 82,
		baseLockOn: 72
	},
	{
		id: "jet_valkyrie",
		name: "星雲女武神 X-7",
		codeName: "NX-07 VALKYRIE",
		liveryColor: "#6366F1",
		accentColor: "#67E8F9",
		description: "重裝火力型星際戰機，專為高頻拼字母艦與文法蟲洞強襲打造。",
		unlockCores: 120,
		baseFirepower: 86,
		baseShield: 76,
		baseMobility: 70,
		baseLockOn: 80
	},
	{
		id: "jet_aegis_star",
		name: "極光王牌號 Ω",
		codeName: "AEGIS-Ω ACE",
		liveryColor: "#14B8A6",
		accentColor: "#FCD34D",
		description: "旗艦級次世代航電戰機，全頻語音鎖定與偏折力場皆達頂尖水準。",
		unlockCores: 200,
		baseFirepower: 92,
		baseShield: 90,
		baseMobility: 88,
		baseLockOn: 94
	}
];
var ENGLISH_MODULES = [
	{
		id: "wing_standard",
		slot: "wing",
		name: "標準航電穩定翼",
		specLabel: "標準機翼",
		description: "提供平穩俯仰控制與基礎巡航速度。",
		unlockCores: 0,
		firepowerDelta: 0,
		shieldDelta: 4,
		mobilityDelta: 6,
		lockOnDelta: 4
	},
	{
		id: "wing_supersonic",
		slot: "wing",
		name: "超音速後掠機翼",
		specLabel: "機體改裝件",
		description: "顯著強化橫向閃避機動性，輕鬆躲避干擾彈幕。",
		unlockCores: 35,
		firepowerDelta: 4,
		shieldDelta: 2,
		mobilityDelta: 18,
		lockOnDelta: 6
	},
	{
		id: "wing_ion_thruster",
		slot: "wing",
		name: "離子脈衝推進器",
		specLabel: "推進改裝件",
		description: "高速推進同時為武器莢艙提供額外輸出功率。",
		unlockCores: 75,
		firepowerDelta: 12,
		shieldDelta: 6,
		mobilityDelta: 22,
		lockOnDelta: 8
	},
	{
		id: "pod_dual_laser",
		slot: "weaponPod",
		name: "雙聯裝雷射砲",
		specLabel: "武器莢艙",
		description: "雙管高頻雷射速射，精準擊墜目標單字無人機。",
		unlockCores: 0,
		firepowerDelta: 8,
		shieldDelta: 0,
		mobilityDelta: 2,
		lockOnDelta: 6
	},
	{
		id: "pod_phonics_missile",
		slot: "weaponPod",
		name: "音標追蹤飛彈",
		specLabel: "武器莢艙",
		description: "根據自然發音聲紋自動修正彈道，對母艦護盾傷害大幅提升。",
		unlockCores: 40,
		firepowerDelta: 18,
		shieldDelta: 0,
		mobilityDelta: 0,
		lockOnDelta: 16
	},
	{
		id: "pod_emp_net",
		slot: "weaponPod",
		name: "電磁脈衝網發射艙",
		specLabel: "武器莢艙",
		description: "命中時釋放電磁脈衝緩速敵群，並為機體補充護盾能量。",
		unlockCores: 80,
		firepowerDelta: 14,
		shieldDelta: 14,
		mobilityDelta: 4,
		lockOnDelta: 12
	},
	{
		id: "chip_deflector",
		slot: "avionicsChip",
		name: "偏折能量護盾晶片",
		specLabel: "護盾晶片",
		description: "機身外層形成能量偏折場，吸收碰撞與誤擊損傷。",
		unlockCores: 0,
		firepowerDelta: 0,
		shieldDelta: 10,
		mobilityDelta: 0,
		lockOnDelta: 4
	},
	{
		id: "chip_voice_lock",
		slot: "avionicsChip",
		name: "聲紋鎖定航電晶片",
		specLabel: "航電晶片",
		description: "強化英語聽力訊號解析，延長鎖定判定窗口與連擊分數。",
		unlockCores: 45,
		firepowerDelta: 6,
		shieldDelta: 8,
		mobilityDelta: 4,
		lockOnDelta: 20
	},
	{
		id: "chip_aegis_matrix",
		slot: "avionicsChip",
		name: "極光偏折護盾矩陣",
		specLabel: "旗艦護盾晶片",
		description: "自動再生偏折護盾並提升全系統反應速度。",
		unlockCores: 90,
		firepowerDelta: 8,
		shieldDelta: 22,
		mobilityDelta: 8,
		lockOnDelta: 14
	}
];
function computeEnglishHangarRadar(profile) {
	const jet = ENGLISH_JETS.find((j) => j.id === profile.activeJetId) ?? ENGLISH_JETS[0];
	const wing = ENGLISH_MODULES.find((m) => m.id === profile.loadout.wingModuleId) ?? ENGLISH_MODULES[0];
	const pod = ENGLISH_MODULES.find((m) => m.id === profile.loadout.weaponPodId) ?? ENGLISH_MODULES[3];
	const chip = ENGLISH_MODULES.find((m) => m.id === profile.loadout.avionicsChipId) ?? ENGLISH_MODULES[6];
	const clamp = (v) => Math.max(20, Math.min(100, Math.round(v)));
	return {
		firepower: clamp(jet.baseFirepower + wing.firepowerDelta + pod.firepowerDelta + chip.firepowerDelta),
		shield: clamp(jet.baseShield + wing.shieldDelta + pod.shieldDelta + chip.shieldDelta),
		mobility: clamp(jet.baseMobility + wing.mobilityDelta + pod.mobilityDelta + chip.mobilityDelta),
		lockOn: clamp(jet.baseLockOn + wing.lockOnDelta + pod.lockOnDelta + chip.lockOnDelta),
		jet,
		wing,
		pod,
		chip
	};
}
function isScienceUnlockedForGrade(grade) {
	return grade >= 3;
}
// src/data/itemsAndGems.ts
var GEM_ELEMENTS = {
	ink_ruby: {
		id: "ink_ruby",
		name: "文華紅寶石",
		subjectLabel: "國語火炎",
		color: "#F43F5E",
		glow: "rgba(244, 63, 94, 0.55)",
		statLabel: "攻擊力＋暴擊率",
		attackPerLevel: 5,
		hpPerLevel: 4,
		critPerLevel: .03,
		ultBonusPerLevel: 1,
		shopPriceCoins: 120
	},
	star_sapphire: {
		id: "star_sapphire",
		name: "星語藍寶石",
		subjectLabel: "英語星能",
		color: "#06B6D4",
		glow: "rgba(6, 182, 212, 0.55)",
		statLabel: "必殺充能＋攻速",
		attackPerLevel: 3,
		hpPerLevel: 6,
		critPerLevel: .02,
		ultBonusPerLevel: 4,
		shopPriceCoins: 120
	},
	gear_topaz: {
		id: "gear_topaz",
		name: "數律金黃石",
		subjectLabel: "數學精密",
		color: "#F59E0B",
		glow: "rgba(245, 158, 11, 0.55)",
		statLabel: "高暴擊＋破防傷害",
		attackPerLevel: 6,
		hpPerLevel: 2,
		critPerLevel: .04,
		ultBonusPerLevel: 2,
		shopPriceCoins: 130
	},
	leaf_emerald: {
		id: "leaf_emerald",
		name: "森羅翠綠石",
		subjectLabel: "自然生機",
		color: "#10B981",
		glow: "rgba(16, 185, 129, 0.55)",
		statLabel: "最大生命＋減傷護盾",
		attackPerLevel: 2,
		hpPerLevel: 18,
		critPerLevel: .01,
		ultBonusPerLevel: 2,
		shopPriceCoins: 115
	}
};
var ASCENSION_PATHS = {
	base: {
		id: "base",
		name: "學園制式",
		subtitle: "均衡堅實的初階神兵",
		auraPrimary: "#94A3B8",
		auraSecondary: "#E2E8F0",
		passiveTitle: "智光啟蒙",
		passiveDesc: "強化達 +5 後即可於神兵鍛造屋覺醒為英雄、神話或地獄三路線！",
		attackMultiplier: 1,
		hpBonus: 0,
		critBonus: 0,
		shieldMitigation: 0,
		ultBonus: 0,
		crystalCost: 0,
		coinCost: 0,
		minEnhanceLevel: 0
	},
	hero: {
		id: "hero",
		name: "英雄路線・聖光守護",
		subtitle: "金色聖盾光環・高容錯穩健型",
		auraPrimary: "#FACC15",
		auraSecondary: "#FEF08A",
		passiveTitle: "聖光庇護",
		passiveDesc: "最大生命 +65、減傷 18%、攻擊 +18%，對戰與 Boss 戰最耐打！",
		attackMultiplier: 1.18,
		hpBonus: 65,
		critBonus: .05,
		shieldMitigation: .18,
		ultBonus: 6,
		crystalCost: 12,
		coinCost: 350,
		minEnhanceLevel: 5
	},
	mythic: {
		id: "mythic",
		name: "神話路線・星辰賢者",
		subtitle: "星藍紫霞光環・高速必殺連擊型",
		auraPrimary: "#38BDF8",
		auraSecondary: "#A855F7",
		passiveTitle: "星軌迴響",
		passiveDesc: "攻擊 +26%、必殺充能 +16%、暴擊率 +12%，必殺特寫連發！",
		attackMultiplier: 1.26,
		hpBonus: 30,
		critBonus: .12,
		shieldMitigation: .08,
		ultBonus: 16,
		crystalCost: 16,
		coinCost: 420,
		minEnhanceLevel: 5
	},
	inferno: {
		id: "inferno",
		name: "地獄路線・緋紅破滅",
		subtitle: "熾紅黑焰光環・極致爆發暴擊型",
		auraPrimary: "#F43F5E",
		auraSecondary: "#FB923C",
		passiveTitle: "緋焰審判",
		passiveDesc: "攻擊 +40%、暴擊率 +22%，單發答題即可轟出破表紅字暴擊！",
		attackMultiplier: 1.4,
		hpBonus: 10,
		critBonus: .22,
		shieldMitigation: .04,
		ultBonus: 8,
		crystalCost: 18,
		coinCost: 480,
		minEnhanceLevel: 5
	}
};
function createStarterWeapon() {
	return {
		uid: "wp-starter-01",
		templateId: "wp_starter_pen",
		name: "學園墨光短刃",
		baseAttack: 24,
		enhanceLevel: 2,
		ascensionPath: "base",
		rarity: "rare",
		socketedGems: [
			{
				uid: "gem-init-1",
				element: "ink_ruby",
				level: 1
			},
			null,
			null
		]
	};
}
// src/data/heroProgression.ts
var HERO_TIERS = {
	1: {
		tier: 1,
		name: "一階・見習守護者",
		subtitle: "初探智光學園的新星勇者",
		minLevel: 1,
		badgeCost: 0,
		coinCost: 0,
		attackBonusPct: 0,
		hpBonusPct: 0,
		auraColor: "#38BDF8",
		unlockNote: "起始階級，掌握四大科目基礎戰技"
	},
	2: {
		tier: 2,
		name: "二階・菁英守護者",
		subtitle: "覺醒專屬武器光環與一轉職業",
		minLevel: 10,
		badgeCost: 6,
		coinCost: 220,
		attackBonusPct: 18,
		hpBonusPct: 20,
		auraColor: "#F59E0B",
		unlockNote: "解鎖「一轉職業選擇」（劍豪／魔導士／聖光守衛）"
	},
	3: {
		tier: 3,
		name: "三階・大師守護者",
		subtitle: "施展覺醒奧義的二轉終極強者",
		minLevel: 25,
		badgeCost: 14,
		coinCost: 480,
		attackBonusPct: 40,
		hpBonusPct: 42,
		auraColor: "#C084FC",
		unlockNote: "解鎖「二轉終極職業」（無雙戰神／星界大賢者／萬靈御獸師）"
	},
	4: {
		tier: 4,
		name: "四階・傳說智光聖者",
		subtitle: "展開金色聖光之翼的全職共鳴傳說",
		minLevel: 40,
		badgeCost: 24,
		coinCost: 900,
		attackBonusPct: 68,
		hpBonusPct: 70,
		auraColor: "#FDE047",
		unlockNote: "展開金色聖光翅膀＋全職業被動共鳴加成"
	}
};
var HERO_CLASSES = {
	novice: {
		id: "novice",
		branch: "none",
		requiredTier: 1,
		name: "見習學園劍士",
		branchLabel: "基礎平衡系",
		tagline: "均衡發展的智光學園冒險者",
		passiveTitle: "智光初心",
		passiveDesc: "各科目穩定發揮，累積經驗與進階徽章準備轉職。",
		visualEffectDesc: "湛藍智光紋章環繞",
		accentColor: "#38BDF8",
		badgeColor: "#0284C7",
		attackBonus: 0,
		hpBonus: 0,
		critBonus: 0,
		thinkTimeBonusSec: 0
	},
	star_swordsman: {
		id: "star_swordsman",
		branch: "blade",
		requiredTier: 2,
		name: "星痕劍豪",
		branchLabel: "破軍武聖系・一轉",
		tagline: "極致爆發・連擊無雙流",
		passiveTitle: "三連星痕劍氣",
		passiveDesc: "答對題目額外發射 3 道穿透劍氣，連擊越高暴擊傷害倍率最高達 300%！",
		visualEffectDesc: "赤金穿透劍氣與烈焰殘影",
		accentColor: "#F97316",
		badgeColor: "#EA580C",
		attackBonus: 18,
		hpBonus: 15,
		critBonus: .14,
		thinkTimeBonusSec: 0
	},
	peerless_warlord: {
		id: "peerless_warlord",
		branch: "blade",
		requiredTier: 3,
		name: "無雙戰神",
		branchLabel: "破軍武聖系・二轉終極",
		tagline: "連續 3 題覺醒・全螢幕震波",
		passiveTitle: "無雙覺醒狀態",
		passiveDesc: "連續答對 3 題進入 10 秒「無雙覺醒」（攻速翻倍＋普攻附帶全螢幕劍氣震波）！",
		visualEffectDesc: "黃金烈焰戰氣＋全螢幕劍氣震波",
		accentColor: "#EF4444",
		badgeColor: "#DC2626",
		attackBonus: 36,
		hpBonus: 35,
		critBonus: .24,
		thinkTimeBonusSec: 0
	},
	element_mage: {
		id: "element_mage",
		branch: "arcane",
		requiredTier: 2,
		name: "元素魔導士",
		branchLabel: "奧術賢者系・一轉",
		tagline: "元素控場・連鎖擴散流",
		passiveTitle: "雷冰連鎖擴散",
		passiveDesc: "答對題目引發連鎖閃電＋冰霜減速，傷害擴散全場並使敵人緩速 35%！",
		visualEffectDesc: "紫藍星辰法陣與連鎖電弧",
		accentColor: "#A855F7",
		badgeColor: "#7E22CE",
		attackBonus: 14,
		hpBonus: 18,
		critBonus: .08,
		thinkTimeBonusSec: 1.5
	},
	astral_archmage: {
		id: "astral_archmage",
		branch: "arcane",
		requiredTier: 3,
		name: "星界大賢者",
		branchLabel: "奧術賢者系・二轉終極",
		tagline: "思維延伸・天降流星雨",
		passiveTitle: "三星隕落奧義",
		passiveDesc: "答題思考時間 +3 秒！每答對集 1 顆元素星辰，集滿 3 顆自動召喚「天降流星雨」破盾轟炸全場！",
		visualEffectDesc: "三顆繞行元素星辰＋天降流星雨",
		accentColor: "#818CF8",
		badgeColor: "#4F46E5",
		attackBonus: 28,
		hpBonus: 30,
		critBonus: .14,
		thinkTimeBonusSec: 3
	},
	holy_sentinel: {
		id: "holy_sentinel",
		branch: "guardian",
		requiredTier: 2,
		name: "聖光守衛",
		branchLabel: "聖盾御獸師系・一轉",
		tagline: "鋼鐵反傷・能量護盾流",
		passiveTitle: "智慧反射聖盾",
		passiveDesc: "每次答對立即展開「智慧能量護盾」，受擊將 120% 傷害反彈給敵人並大幅提升生存！",
		visualEffectDesc: "六角金色光盾與反傷聖紋",
		accentColor: "#10B981",
		badgeColor: "#059669",
		attackBonus: 10,
		hpBonus: 48,
		critBonus: .06,
		thinkTimeBonusSec: 1
	},
	beast_sovereign: {
		id: "beast_sovereign",
		branch: "guardian",
		requiredTier: 3,
		name: "萬靈御獸師",
		branchLabel: "聖盾御獸師系・二轉終極",
		tagline: "雙精靈協戰・合體技 +50%",
		passiveTitle: "雙靈共鳴契約",
		passiveDesc: "同時派出 2 隻守護精靈協戰攻擊與回血！2～4 人同樂「合體無雙技」威力額外 +50%！",
		visualEffectDesc: "雙守護精靈環繞＋翡翠金翼光環",
		accentColor: "#14B8A6",
		badgeColor: "#0D9488",
		attackBonus: 24,
		hpBonus: 82,
		critBonus: .12,
		thinkTimeBonusSec: 1.5
	}
};
function createInitialHeroProgression() {
	return {
		tier: 1,
		classBranch: "none",
		classId: "novice",
		badges: 8,
		secondaryGuardian: "stardragon"
	};
}
function getBestiaryBonusPercent(discoveredIds) {
	const unique = new Set(discoveredIds).size;
	return Math.min(24, Math.floor(unique / 2) * 3);
}
// src/core/combatMath.ts
function computeWeaponPower(weapon) {
	const path = ASCENSION_PATHS[weapon.ascensionPath];
	const enhancedAtk = Math.round((weapon.baseAttack + weapon.enhanceLevel * 5.5) * path.attackMultiplier);
	let gemAtk = 0;
	let gemHp = 0;
	let gemCrit = 0;
	let gemUlt = 0;
	for (const gem of weapon.socketedGems) {
		if (!gem) continue;
		const def = GEM_ELEMENTS[gem.element];
		gemAtk += def.attackPerLevel * gem.level;
		gemHp += def.hpPerLevel * gem.level;
		gemCrit += def.critPerLevel * gem.level;
		gemUlt += def.ultBonusPerLevel * gem.level;
	}
	return {
		attack: enhancedAtk + gemAtk,
		hp: path.hpBonus + gemHp,
		critChance: Number(Math.min(.65, path.critBonus + gemCrit).toFixed(3)),
		ultBonus: path.ultBonus + gemUlt,
		shieldMitigation: path.shieldMitigation
	};
}
function computePlayerCombatStats(level, equipment, guardianId, bondLevel, equippedWeapon, heroProgression, discoveredBestiary = []) {
	const prog = heroProgression ?? createInitialHeroProgression();
	const tierDef = HERO_TIERS[prog.tier] ?? HERO_TIERS[1];
	const classDef = HERO_CLASSES[prog.classId] ?? HERO_CLASSES.novice;
	const bestiaryBonusPct = getBestiaryBonusPercent(discoveredBestiary);
	const weaponPower = equippedWeapon ? computeWeaponPower(equippedWeapon) : {
		attack: equipment.weapon * 6,
		hp: 0,
		critChance: .05,
		ultBonus: 0,
		shieldMitigation: 0
	};
	const tierAtkMult = 1 + (tierDef.attackBonusPct + bestiaryBonusPct) / 100;
	const tierHpMult = 1 + (tierDef.hpBonusPct + bestiaryBonusPct) / 100;
	const rawAtk = 18 + (level - 1) * 4 + weaponPower.attack + bondLevel * 1.5 + classDef.attackBonus;
	const baseAttack = Math.round(rawAtk * tierAtkMult);
	const rawMaxHp = (100 + (level - 1) * 10 + equipment.armor * 16 + weaponPower.hp + bondLevel * 4 + classDef.hpBonus) * tierHpMult;
	return {
		baseAttack,
		maxHp: Math.round(guardianId === "deer" ? rawMaxHp * 1.2 : rawMaxHp),
		speedBonus: Number((equipment.boots * .06 + (prog.tier >= 4 ? .12 : 0)).toFixed(2)),
		bondLevel,
		critChance: Number(Math.min(.85, weaponPower.critChance + classDef.critBonus).toFixed(3)),
		shieldMitigation: weaponPower.shieldMitigation + (prog.classBranch === "guardian" ? .12 : 0),
		ultChargeBonus: weaponPower.ultBonus + (prog.tier >= 3 ? 6 : 0),
		weaponPath: equippedWeapon?.ascensionPath ?? "base",
		weaponEnhanceLevel: equippedWeapon?.enhanceLevel ?? 0,
		weaponName: equippedWeapon?.name ?? "學園墨光短刃",
		heroTier: prog.tier,
		heroClassId: prog.classId,
		heroClassBranch: prog.classBranch,
		thinkTimeBonusSec: classDef.thinkTimeBonusSec + (prog.tier >= 4 ? 1.5 : 0),
		bestiaryBonusPct,
		secondaryGuardian: prog.secondaryGuardian ?? "stardragon"
	};
}
function computeSaveCombatStats(save) {
	const equipped = save.weapons.find((w) => w.uid === save.equippedWeaponUid) ?? save.weapons[0] ?? null;
	return computePlayerCombatStats(save.level, save.equipment, save.selectedGuardian, save.guardianBonds[save.selectedGuardian] ?? 1, equipped, save.heroProgression, save.discoveredBestiary ?? []);
}
/**
* Computes subject-specific combat stats driven by the student's independent SubjectProfile
* (Mandarin RPG Dojo / English Modular Hangar / Math Defense HQ / Science Lab Kitchen).
*/
function computeSubjectCombatStats(save, subject) {
	const base = computeSaveCombatStats(save);
	const profiles = save.subjectProfiles;
	if (!profiles) return base;
	if (subject === "chinese") {
		const p = profiles.chinese;
		const treeLevels = Object.values(p.growthTree).reduce((s, n) => s + n.level, 0);
		return {
			...base,
			baseAttack: Math.round(base.baseAttack + treeLevels * 4 + p.rpgLevel * 2),
			maxHp: Math.round(base.maxHp + (p.growthTree.chi_reading_1?.level ?? 0) * 18),
			critChance: Number(Math.min(.85, base.critChance + (p.growthTree.chi_phonetics_2?.level ?? 0) * .03).toFixed(3)),
			shieldMitigation: Number(Math.min(.45, base.shieldMitigation + (p.growthTree.chi_rhetoric_2?.level ?? 0) * .03).toFixed(3)),
			ultChargeBonus: base.ultChargeBonus + (p.growthTree.chi_idiom_2?.level ?? 0) * 4,
			thinkTimeBonusSec: Number((base.thinkTimeBonusSec + (p.growthTree.chi_reading_2?.level ?? 0) * .4).toFixed(1))
		};
	}
	if (subject === "english") {
		const p = profiles.english;
		const jetBonus = p.unlockedJetIds.length * 6;
		const modBonus = p.unlockedModuleIds.length * 4;
		return {
			...base,
			baseAttack: Math.round(base.baseAttack + jetBonus + modBonus),
			maxHp: Math.round(base.maxHp + p.unlockedJetIds.length * 14),
			speedBonus: Number((base.speedBonus + p.unlockedModuleIds.length * .03).toFixed(2)),
			thinkTimeBonusSec: Number((base.thinkTimeBonusSec + (p.loadout.avionicsChipId === "chip_voice_lock" ? 1.5 : .5)).toFixed(1))
		};
	}
	if (subject === "math") {
		const p = profiles.math;
		const turretPower = Object.values(p.turretUpgrades).reduce((s, lv) => s + lv, 0);
		const treeLevels = Object.values(p.growthTree).reduce((s, n) => s + n.level, 0);
		return {
			...base,
			baseAttack: Math.round(base.baseAttack + turretPower * 5 + treeLevels * 4),
			maxHp: Math.round(base.maxHp + (p.growthTree.math_geo_1?.level ?? 0) * 22),
			critChance: Number(Math.min(.85, base.critChance + (p.growthTree.math_geo_2?.level ?? 0) * .04).toFixed(3)),
			ultChargeBonus: base.ultChargeBonus + (p.growthTree.math_algebra_1?.level ?? 0) * 5,
			thinkTimeBonusSec: Number((base.thinkTimeBonusSec + (p.growthTree.math_measure_2?.level ?? 0) * .5).toFixed(1))
		};
	}
	const p = profiles.science;
	const treeLevels = Object.values(p.growthTree).reduce((s, n) => s + n.level, 0);
	return {
		...base,
		baseAttack: Math.round(base.baseAttack + treeLevels * 4 + p.unlockedCookwareIds.length * 6),
		maxHp: Math.round(base.maxHp + (p.growthTree.sci_bio_1?.level ?? 0) * 20),
		shieldMitigation: Number(Math.min(.45, base.shieldMitigation + (p.growthTree.sci_earth_2?.level ?? 0) * .04).toFixed(3)),
		ultChargeBonus: base.ultChargeBonus + (p.growthTree.sci_energy_2?.level ?? 0) * 5,
		thinkTimeBonusSec: Number((base.thinkTimeBonusSec + (p.growthTree.sci_earth_1?.level ?? 0) * .6).toFixed(1))
	};
}
// src/core/firebase.ts
var firebaseConfig = {
	apiKey: "AIzaSyB4ulK0Zz4yf2A56XsatxSHxviEa2DtrhQ",
	authDomain: "games-2-c3050.firebaseapp.com",
	projectId: "games-2-c3050",
	storageBucket: "games-2-c3050.firebasestorage.app",
	messagingSenderId: "439110038901",
	appId: "1:439110038901:web:b034a7b287540175c00f3c",
	measurementId: "G-206MCJ224P"
};
var app = null;
var dbInstance = null;
try {
	if (firebaseConfig.apiKey && firebaseConfig.projectId) {
		app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
		getAuth(app);
		dbInstance = getFirestore(app);
		if (typeof window !== "undefined") {
			const initializedApp = app;
			isSupported().then((supported) => {
				if (supported) getAnalytics(initializedApp);
			}).catch(() => {});
		}
	}
} catch (err) {
	console.warn("Firebase initialization skipped, using local mode:", err);
}
new GoogleAuthProvider().setCustomParameters({ prompt: "select_account" });
async function testConnection() {
	if (!dbInstance) return;
	try {
		await getDocFromServer(doc(dbInstance, "test", "connection"));
	} catch (error) {
		if (error instanceof Error && error.message.includes("the client is offline")) console.error("Please check your Firebase configuration.");
	}
}
if (typeof window !== "undefined") testConnection();
createContext(null);
// src/data/guardians.ts
var GUARDIANS = {
	qilin: {
		id: "qilin",
		name: "墨麒麟",
		title: "文華瑞獸",
		element: "水墨金光",
		primaryColor: "#F59E0B",
		secondaryColor: "#1E293B",
		accentColor: "#FEF3C7",
		passiveName: "文心聚氣",
		passiveDesc: "基礎攻擊力 +12%，答對時必殺充能額外 +8%",
		activeName: "瑞墨護心",
		activeDesc: "立即回復 35% 生命/城門耐久，並賦予下一次攻擊雙倍傷害",
		activeEffectKey: "ink_heal_boost",
		petLines: [
			"筆落驚風雨，今天也要帥氣通關喔！",
			"摸摸頭～墨香滿滿，錯字通通退散！",
			"連擊越高，我身上的金紋就越耀眼呢！"
		],
		battleCheer: "墨麒麟降下金墨祝福，傷害大幅提升！"
	},
	stardragon: {
		id: "stardragon",
		name: "星核龍",
		title: "超新星幼龍",
		element: "星海電漿",
		primaryColor: "#06B6D4",
		secondaryColor: "#312E81",
		accentColor: "#EC4899",
		passiveName: "星火超載",
		passiveDesc: "PERFECT 速度倍率額外 +0.15x，暴擊更具爆發力",
		activeName: "星核滿載",
		activeDesc: "立刻將必殺技量表直接充滿至 100%，並震懾敵軍！",
		activeEffectKey: "full_ultimate",
		petLines: [
			"吼嗚！能量核心已經預熱完畢，出發吧！",
			"聽仔細英文發音，我們一起轟穿星際防線！",
			"嘿嘿，你的指尖暖呼呼的，羈絆值上升啦！"
		],
		battleCheer: "星核龍釋放超新星能量，必殺技瞬間滿載！"
	},
	griffin: {
		id: "griffin",
		name: "數律獅鷲",
		title: "黃金比例翼王",
		element: "幾何風暴",
		primaryColor: "#3B82F6",
		secondaryColor: "#1E3A8A",
		accentColor: "#FBBF24",
		passiveName: "精密齒輪",
		passiveDesc: "數學塔防開局齒輪 +60，所有世界答題寬限時間 +2 秒",
		activeName: "時空定格",
		activeDesc: "凍結戰場倒數與敵人行動 8 秒，從容解題零壓力！",
		activeEffectKey: "freeze_timer",
		petLines: [
			"黃金比例完美無瑕，算式難不倒我們！",
			"展開雙翼！讓我替你把時間暫停下來思考吧！",
			"每解開一題，我的羽毛就閃耀著數理光輝！"
		],
		battleCheer: "數律獅鷲展開時空領域，敵軍與計時全面停滯！"
	},
	deer: {
		id: "deer",
		name: "森羅鹿靈",
		title: "元素自然使者",
		element: "翡翠生機",
		primaryColor: "#10B981",
		secondaryColor: "#064E3B",
		accentColor: "#A7F3D0",
		passiveName: "自然調和",
		passiveDesc: "最大生命/護盾 +20%，自然料理火候 PERFECT 區間變寬",
		activeName: "森羅結界",
		activeDesc: "展開翡翠無敵護盾 + 立刻補滿料理/戰場資源並清掉干擾彈幕！",
		activeEffectKey: "shield_surge",
		petLines: [
			"風吹過葉梢，大自然的祕密都藏在生活裡喔！",
			"角上的新芽開花了，謝謝你這麼細心照顧我！",
			"別怕答錯，每一次實驗都是最棒的發現！"
		],
		battleCheer: "森羅鹿靈喚起翡翠結界，全隊獲得堅固守護！"
	}
};
GUARDIANS.qilin, GUARDIANS.stardragon, GUARDIANS.griffin, GUARDIANS.deer;
// src/audio/soundEngine.ts
var SoundEngine = class {
	constructor() {
		this.ctx = null;
		this.muted = false;
		this.unlocked = false;
		this.initAutoUnlock();
	}
	initAutoUnlock() {
		if (typeof window === "undefined") return;
		const unlock = () => {
			this.unlockAudio();
		};
		window.addEventListener("touchstart", unlock, {
			once: true,
			passive: true
		});
		window.addEventListener("pointerdown", unlock, {
			once: true,
			passive: true
		});
		window.addEventListener("click", unlock, {
			once: true,
			passive: true
		});
		window.addEventListener("keydown", unlock, {
			once: true,
			passive: true
		});
	}
	/** Explicitly unlocks Web Audio on iOS Safari & Android Chrome via silent 1-sample buffer */
	unlockAudio() {
		if (this.unlocked || typeof window === "undefined") return;
		try {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			if (!AudioCtx) return;
			if (!this.ctx) this.ctx = new AudioCtx();
			if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
			const silentBuffer = this.ctx.createBuffer(1, 1, 22050);
			const src = this.ctx.createBufferSource();
			src.buffer = silentBuffer;
			src.connect(this.ctx.destination);
			src.start(0);
			this.unlocked = true;
		} catch {}
	}
	/** Subtle tactile mobile vibration pulse when supported */
	hapticPulse(durationMs = 14) {
		if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") try {
			navigator.vibrate(durationMs);
		} catch {}
	}
	setMuted(muted) {
		this.muted = muted;
		if (muted && typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
	}
	isMuted() {
		return this.muted;
	}
	ensureContext() {
		if (this.muted || typeof window === "undefined") return null;
		if (!this.ctx) {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			if (!AudioCtx) return null;
			this.ctx = new AudioCtx();
		}
		if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
		return this.ctx;
	}
	playClick() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(620, now);
		osc.frequency.exponentialRampToValueAtTime(920, now + .055);
		gain.gain.setValueAtTime(.11, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .065);
		osc.connect(gain).connect(ctx.destination);
		osc.start(now);
		osc.stop(now + .07);
	}
	playSlash() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const bufferSize = Math.floor(ctx.sampleRate * .16);
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
		const noise = ctx.createBufferSource();
		noise.buffer = buffer;
		const filter = ctx.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.setValueAtTime(2400, now);
		filter.frequency.exponentialRampToValueAtTime(520, now + .14);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(.24, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .16);
		noise.connect(filter).connect(gain).connect(ctx.destination);
		noise.start(now);
		const blade = ctx.createOscillator();
		const bladeGain = ctx.createGain();
		blade.type = "sawtooth";
		blade.frequency.setValueAtTime(980, now);
		blade.frequency.exponentialRampToValueAtTime(220, now + .13);
		bladeGain.gain.setValueAtTime(.1, now);
		bladeGain.gain.exponentialRampToValueAtTime(.001, now + .14);
		blade.connect(bladeGain).connect(ctx.destination);
		blade.start(now);
		blade.stop(now + .15);
	}
	playLaser() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sawtooth";
		const pitchJitter = .94 + Math.random() * .12;
		osc.frequency.setValueAtTime(1180 * pitchJitter, now);
		osc.frequency.exponentialRampToValueAtTime(280 * pitchJitter, now + .08);
		gain.gain.setValueAtTime(.075, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .09);
		osc.connect(gain).connect(ctx.destination);
		osc.start(now);
		osc.stop(now + .095);
	}
	playExplosion() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const bufferSize = Math.floor(ctx.sampleRate * .34);
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
		const noise = ctx.createBufferSource();
		noise.buffer = buffer;
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.setValueAtTime(680, now);
		filter.frequency.exponentialRampToValueAtTime(85, now + .32);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(.28, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .34);
		noise.connect(filter).connect(gain).connect(ctx.destination);
		noise.start(now);
	}
	playGearBuild() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[
			330,
			495,
			660
		].forEach((freq, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "square";
			const t = now + idx * .05;
			osc.frequency.setValueAtTime(freq, t);
			gain.gain.setValueAtTime(.08, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .07);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .075);
		});
	}
	playSizzleChop() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const bufferSize = Math.floor(ctx.sampleRate * .18);
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * .8;
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		const filter = ctx.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.setValueAtTime(2800, now);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(.14, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .18);
		src.connect(filter).connect(gain).connect(ctx.destination);
		src.start(now);
	}
	playCorrectChord(combo = 1) {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const semitoneShift = Math.min(10, Math.max(0, combo - 1));
		const factor = Math.pow(2, semitoneShift / 12);
		[
			523.25 * factor,
			659.25 * factor,
			783.99 * factor
		].forEach((f, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			const start = now + idx * .045;
			osc.frequency.setValueAtTime(f, start);
			gain.gain.setValueAtTime(.12, start);
			gain.gain.exponentialRampToValueAtTime(.001, start + .25);
			osc.connect(gain).connect(ctx.destination);
			osc.start(start);
			osc.stop(start + .26);
		});
	}
	playPerfectBell() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[
			1046.5,
			1318.5,
			1567.98,
			2093
		].forEach((f, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "triangle";
			const t = now + idx * .035;
			osc.frequency.setValueAtTime(f, t);
			gain.gain.setValueAtTime(.11, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .42);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .44);
		});
	}
	playWrongBuzz() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[195, 155].forEach((f, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sawtooth";
			const t = now + idx * .09;
			osc.frequency.setValueAtTime(f, t);
			gain.gain.setValueAtTime(.11, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .14);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .15);
		});
	}
	playUltimateRoar() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(160, now);
		osc.frequency.exponentialRampToValueAtTime(880, now + .35);
		osc.frequency.exponentialRampToValueAtTime(220, now + .72);
		gain.gain.setValueAtTime(.18, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .75);
		osc.connect(gain).connect(ctx.destination);
		osc.start(now);
		osc.stop(now + .76);
	}
	playPetChime() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[
			784,
			988,
			1175
		].forEach((f, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			const t = now + i * .055;
			osc.frequency.setValueAtTime(f, t);
			gain.gain.setValueAtTime(.1, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .22);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .24);
		});
	}
	playVictoryFanfare() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[
			523.25,
			659.25,
			783.99,
			1046.5
		].forEach((f, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "triangle";
			const t = now + idx * .11;
			osc.frequency.setValueAtTime(f, t);
			gain.gain.setValueAtTime(.14, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .45);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .47);
		});
	}
	playDefeatSting() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[
			392,
			349.23,
			311.13,
			261.63
		].forEach((f, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			const t = now + idx * .15;
			osc.frequency.setValueAtTime(f, t);
			gain.gain.setValueAtTime(.13, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .35);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .38);
		});
	}
	playPvpImpact() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(220, now);
		osc.frequency.exponentialRampToValueAtTime(52, now + .24);
		gain.gain.setValueAtTime(.32, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .26);
		osc.connect(gain).connect(ctx.destination);
		osc.start(now);
		osc.stop(now + .27);
		this.playSlash();
	}
	playForgeHammer() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[
			880,
			1320,
			1760
		].forEach((f, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "triangle";
			const t = now + idx * .025;
			osc.frequency.setValueAtTime(f, t);
			osc.frequency.exponentialRampToValueAtTime(f * .72, t + .26);
			gain.gain.setValueAtTime(.14, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .28);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .3);
		});
	}
	playGemSynth() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[
			660,
			880,
			1175,
			1568,
			2093
		].forEach((f, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			const t = now + idx * .045;
			osc.frequency.setValueAtTime(f, t);
			gain.gain.setValueAtTime(.11, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .32);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .34);
		});
	}
	playJammerCast() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(520, now);
		osc.frequency.exponentialRampToValueAtTime(140, now + .28);
		gain.gain.setValueAtTime(.14, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .3);
		osc.connect(gain).connect(ctx.destination);
		osc.start(now);
		osc.stop(now + .32);
	}
	playStarChime(starIndex) {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		const f = [
			587.33,
			783.99,
			1046.5
		][Math.min(2, Math.max(0, starIndex - 1))];
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(f, now);
		osc.frequency.exponentialRampToValueAtTime(f * 1.03, now + .24);
		gain.gain.setValueAtTime(.16, now);
		gain.gain.exponentialRampToValueAtTime(.001, now + .28);
		osc.connect(gain).connect(ctx.destination);
		osc.start(now);
		osc.stop(now + .3);
	}
	playChestOpen() {
		const ctx = this.ensureContext();
		if (!ctx) return;
		const now = ctx.currentTime;
		[
			523.25,
			659.25,
			783.99,
			1046.5,
			1318.5
		].forEach((f, idx) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "triangle";
			const t = now + idx * .055;
			osc.frequency.setValueAtTime(f, t);
			gain.gain.setValueAtTime(.14, t);
			gain.gain.exponentialRampToValueAtTime(.001, t + .36);
			osc.connect(gain).connect(ctx.destination);
			osc.start(t);
			osc.stop(t + .38);
		});
	}
	speakText(text, lang) {
		if (this.muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
		try {
			window.speechSynthesis.cancel();
			const utter = new SpeechSynthesisUtterance(text);
			utter.lang = lang;
			utter.rate = lang === "en-US" ? .92 : 1.02;
			utter.pitch = 1.02;
			window.speechSynthesis.speak(utter);
		} catch {}
	}
};
new SoundEngine();
// src/core/GameStateContext.tsx
function todayKey() {
	const d = /* @__PURE__ */ new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function createInitialDailyQuests() {
	return [
		{
			id: "q_answer_5",
			title: "答對 5 道 108 課綱題目",
			target: 5,
			current: 0,
			rewardCoins: 120,
			rewardCrystals: 3,
			claimed: false
		},
		{
			id: "q_clear_1",
			title: "通關任一科目世界 Boss",
			target: 1,
			current: 0,
			rewardCoins: 160,
			rewardCrystals: 4,
			claimed: false
		},
		{
			id: "q_pvp_1",
			title: "完成 1 場線上知識競技對戰",
			target: 1,
			current: 0,
			rewardCoins: 180,
			rewardCrystals: 5,
			claimed: false
		}
	];
}
function createInitialPlayerSave() {
	return {
		level: 1,
		xp: 0,
		coins: 520,
		crystals: 20,
		bestStreak: 0,
		selectedGuardian: "qilin",
		unlockedGuardians: [
			"qilin",
			"stardragon",
			"griffin",
			"deer"
		],
		guardianBonds: {
			qilin: 2,
			stardragon: 1,
			griffin: 1,
			deer: 1
		},
		equipment: {
			weapon: 1,
			helm: 1,
			armor: 1,
			gloves: 1,
			boots: 1,
			amulet: 1
		},
		weapons: [createStarterWeapon(), {
			uid: "wp-starter-02",
			templateId: "wp_star_lance",
			name: "星輝脈衝長槍",
			baseAttack: 32,
			enhanceLevel: 5,
			ascensionPath: "base",
			rarity: "epic",
			socketedGems: [
				null,
				null,
				null
			]
		}],
		equippedWeaponUid: "wp-starter-02",
		gemBag: [
			{
				uid: "g-seed-1",
				element: "ink_ruby",
				level: 1
			},
			{
				uid: "g-seed-2",
				element: "ink_ruby",
				level: 1
			},
			{
				uid: "g-seed-3",
				element: "ink_ruby",
				level: 1
			},
			{
				uid: "g-seed-4",
				element: "star_sapphire",
				level: 1
			},
			{
				uid: "g-seed-5",
				element: "gear_topaz",
				level: 1
			},
			{
				uid: "g-seed-6",
				element: "leaf_emerald",
				level: 1
			}
		],
		items: {
			wisdom_potion: 2,
			combo_charm: 2,
			shield_scroll: 2,
			time_hourglass: 2,
			forge_guard: 2
		},
		selectedTitle: "title_novice",
		unlockedTitles: ["title_novice"],
		grade: 4,
		semester: "upper",
		playMode: "adventure",
		muted: false,
		subjectStats: {
			chinese: {
				answered: 0,
				correct: 0,
				bestScore: 0,
				starsEarned: 0,
				clears: 0
			},
			english: {
				answered: 0,
				correct: 0,
				bestScore: 0,
				starsEarned: 0,
				clears: 0
			},
			math: {
				answered: 0,
				correct: 0,
				bestScore: 0,
				starsEarned: 0,
				clears: 0
			},
			science: {
				answered: 0,
				correct: 0,
				bestScore: 0,
				starsEarned: 0,
				clears: 0
			}
		},
		wrongRecords: [],
		unlockedCards: [],
		trajectory: [],
		dailyQuests: createInitialDailyQuests(),
		dailyPlaySeconds: 0,
		lastPlayDate: todayKey(),
		pvp: {
			rating: 1e3,
			wins: 0,
			losses: 0,
			winStreak: 0,
			bestWinStreak: 0,
			honorTokens: 60
		},
		parentSettings: {
			pinCode: "1234",
			dailyLimitMinutes: 45,
			pvpEnabled: true,
			forcePracticeMode: false
		},
		stageProgress: {},
		masteredQuestionIds: [],
		knowledgeMastery: {},
		rapidGuessCount: 0,
		playerCount: 1,
		heroProgression: createInitialHeroProgression(),
		towerBestFloor: 0,
		discoveredBestiary: [
			"bst_chi_moth",
			"bst_eng_drone",
			"bst_math_zero",
			"bst_sci_glutton"
		],
		subjectProfiles: createInitialSubjectProfiles(),
		learningMilestones: [],
		tagMastery: {},
		todayPracticeQueue: []
	};
}
createContext(null);
// src/core/campaignAndQuestions.test.ts
test("Question bank has 400+ original Taiwan 108 Curriculum questions with >= 25 per grade × subject and unique IDs", () => {
	assert.ok(ALL_QUESTIONS.length >= 400, `Expected >= 400 questions, got ${ALL_QUESTIONS.length}`);
	const ids = /* @__PURE__ */ new Set();
	for (const q of ALL_QUESTIONS) {
		assert.ok(!ids.has(q.id), `Duplicate question ID detected: ${q.id}`);
		ids.add(q.id);
		assert.ok(q.prompt.trim().length > 0, `Empty prompt on ${q.id}`);
		assert.ok(q.explanation.trim().length > 0, `Empty explanation on ${q.id}`);
		assert.ok(q.knowledgeTag.trim().length > 0, `Empty knowledgeTag on ${q.id}`);
	}
	const subjects = [
		"chinese",
		"english",
		"math",
		"science"
	];
	const grades = [
		3,
		4,
		5,
		6
	];
	for (const s of subjects) for (const g of grades) {
		const bucket = ALL_QUESTIONS.filter((q) => q.subject === s && q.grade === g);
		assert.ok(bucket.length >= 25, `Expected >= 25 questions for ${s} grade ${g}, got ${bucket.length}`);
	}
	for (const g of grades) {
		assert.ok(getChineseQuestions(g, "upper", "slash").length > 0);
		assert.ok(getChineseQuestions(g, "upper", "radical").length > 0);
		assert.ok(getChineseQuestions(g, "upper", "typo").length > 0);
		assert.ok(getEnglishQuestions(g, "upper", "listen").length > 0);
		assert.ok(getEnglishQuestions(g, "upper", "spell").length > 0);
		assert.ok(getMathQuestions(g, "upper").length > 0);
		assert.ok(getScienceQuestions(g, "upper").length > 0);
	}
});
test("QuestionManager guarantees zero repeats inside a full pass and prioritizes wrong -> focus -> unmastered -> mastered", () => {
	const realSample = getMathQuestions(4, "upper").slice(0, 4);
	assert.equal(realSample.length, 4);
	const [qMastered, qGeneral, qFocus, qWrong] = realSample;
	const focusTag = "__FOCUS_TEST_TAG__";
	const mgr = new QuestionManager([
		{
			...qMastered,
			id: "q-mastered",
			knowledgeTag: "其他"
		},
		{
			...qGeneral,
			id: "q-general",
			knowledgeTag: "一般"
		},
		{
			...qFocus,
			id: "q-focus",
			knowledgeTag: focusTag
		},
		{
			...qWrong,
			id: "q-wrong",
			knowledgeTag: "錯題"
		}
	], {
		wrongQuestionIds: ["q-wrong"],
		focusTags: [focusTag],
		masteredQuestionIds: ["q-mastered"]
	});
	const drawn = [
		mgr.next().id,
		mgr.next().id,
		mgr.next().id,
		mgr.next().id
	];
	assert.deepEqual(drawn, [
		"q-wrong",
		"q-focus",
		"q-general",
		"q-mastered"
	]);
	assert.equal(new Set(drawn).size, 4, "Zero duplicates within single pass");
	const fifth = mgr.next().id;
	assert.notEqual(fifth, "q-mastered", "Should never immediately repeat the previous question on recycle");
});
test("Campaign map has 3 chapters × 10 progressive stages per subject/grade with Stage 7 Elite, Stage 10 Mega-Boss, and sequential unlock", () => {
	for (const s of [
		"chinese",
		"english",
		"math",
		"science"
	]) {
		const chapters = getChaptersForWorld(s, 4);
		assert.equal(chapters.length, 3, `${s} should have 3 chapters`);
		for (const ch of chapters) {
			assert.equal(ch.stages.length, 10, `${s} ch${ch.chapterIndex} should have 10 stages`);
			assert.equal(ch.stages[0].tier, "explore");
			assert.equal(ch.stages[3].tier, "trial");
			assert.equal(ch.stages[6].tier, "elite");
			assert.equal(ch.stages[7].tier, "brawl");
			assert.equal(ch.stages[9].tier, "boss");
			assert.ok(ch.stages[9].enemyName.length > 0);
			assert.ok(ch.stages[9].starChestReward && ch.stages[9].starChestReward.label.length > 0);
		}
		const stage1 = getStageConfig(s, 4, 1, 1);
		const stage2 = getStageConfig(s, 4, 1, 2);
		const ch2Stage1 = getStageConfig(s, 4, 2, 1);
		const ch1Stage10 = getStageConfig(s, 4, 1, 10);
		assert.equal(isStageUnlocked(stage1, {}), true, "Stage 1-1 always unlocked");
		assert.equal(isStageUnlocked(stage2, {}), false, "Stage 1-2 locked initially");
		const progressAfter1 = { [stage1.stageKey]: {
			cleared: true,
			stars: 3,
			bestScore: 1200
		} };
		assert.equal(isStageUnlocked(stage2, progressAfter1), true, "Stage 1-2 unlocks after clearing 1-1");
		assert.equal(isStageUnlocked(ch2Stage1, progressAfter1), false, "Ch2-1 locked until Ch1-10 cleared");
		const progressAfterCh1Boss = {
			...progressAfter1,
			[ch1Stage10.stageKey]: {
				cleared: true,
				stars: 2,
				bestScore: 2500
			}
		};
		assert.equal(isStageUnlocked(ch2Stage1, progressAfterCh1Boss), true, "Ch2-1 unlocks after Ch1-10 cleared");
		assert.equal(getWorldTotalStars(s, 4, progressAfterCh1Boss).earned, 5);
	}
});
test("Expanded 108-curriculum question pool reaches 600+ and procedural math generator produces valid distinct options for Grades 1-6", () => {
	assert.ok(ALL_QUESTIONS.length >= 600, `Expected >= 600 questions, got ${ALL_QUESTIONS.length}`);
	for (const g of [
		1,
		2,
		3,
		4,
		5,
		6
	]) {
		const batchA = generateProceduralMathQuestions(g, "upper", 1, 8);
		const batchB = generateProceduralMathQuestions(g, "lower", 10, 8);
		assert.equal(batchA.length, 8);
		assert.equal(batchB.length, 8);
		for (const q of [...batchA, ...batchB]) {
			assert.equal(q.grade, g);
			assert.equal(q.payload.options.length, 4);
			assert.equal(new Set(q.payload.options).size, 4, `Duplicate math option on ${q.id}`);
			assert.equal(q.payload.options[q.payload.correctIndex], q.answer);
		}
		assert.ok(getChineseQuestions(g, "upper", "slash").length > 0, `Missing G${g} Chinese slash`);
		assert.ok(getChineseQuestions(g, "upper", "radical").length > 0, `Missing G${g} Chinese radical`);
		assert.ok(getChineseQuestions(g, "upper", "typo").length > 0, `Missing G${g} Chinese typo`);
		assert.ok(getEnglishQuestions(g, "upper", "listen").length > 0, `Missing G${g} English listen`);
		assert.ok(getEnglishQuestions(g, "upper", "spell").length > 0, `Missing G${g} English spell`);
	}
});
test("Four-subject independent profiles, lossless legacy migration, Science Grade 1-2 lock, and modular English radar work reliably", () => {
	assert.equal(isScienceUnlockedForGrade(1), false);
	assert.equal(isScienceUnlockedForGrade(2), false);
	assert.equal(isScienceUnlockedForGrade(3), true);
	assert.equal(isScienceUnlockedForGrade(6), true);
	const migrated = migrateLegacySaveToSubjectProfiles({
		level: 10,
		grade: 4,
		subjectStats: {
			chinese: {
				answered: 20,
				correct: 16,
				clears: 3
			},
			english: {
				answered: 18,
				correct: 15,
				clears: 2
			},
			math: {
				answered: 24,
				correct: 20,
				clears: 4
			},
			science: {
				answered: 12,
				correct: 10,
				clears: 1
			}
		}
	});
	assert.ok(migrated.chinese.skillPoints > 2, "Chinese skillPoints should convert from legacy stats");
	assert.ok(migrated.english.hangarCores > 40, "English hangarCores should convert from legacy stats");
	assert.ok(migrated.math.techGears > 2, "Math techGears should convert from legacy stats");
	assert.ok(migrated.science.labCrystals > 2, "Science labCrystals should convert from legacy stats");
	migrated.chinese.growthTree.chi_phonetics_1.level = 3;
	migrated.english.loadout.weaponPodId = "pod_phonics_missile";
	const rehydrated = migrateLegacySaveToSubjectProfiles({ subjectProfiles: migrated });
	assert.equal(rehydrated.chinese.growthTree.chi_phonetics_1.level, 3);
	assert.equal(rehydrated.english.loadout.weaponPodId, "pod_phonics_missile");
	const baseRadar = computeEnglishHangarRadar(migrated.english);
	const flagshipRadar = computeEnglishHangarRadar({
		...migrated.english,
		activeJetId: "jet_aegis_star",
		loadout: {
			wingModuleId: "wing_ion_thruster",
			weaponPodId: "pod_phonics_missile",
			avionicsChipId: "chip_aegis_matrix"
		}
	});
	assert.ok(flagshipRadar.firepower > baseRadar.firepower);
	assert.ok(flagshipRadar.shield > baseRadar.shield);
	assert.ok(flagshipRadar.lockOn > baseRadar.lockOn);
	const baseSave = createInitialPlayerSave();
	const baseMathStats = computeSubjectCombatStats(baseSave, "math");
	const upgradedMathStats = computeSubjectCombatStats({
		...baseSave,
		subjectProfiles: {
			...baseSave.subjectProfiles,
			math: {
				...baseSave.subjectProfiles.math,
				turretUpgrades: {
					...baseSave.subjectProfiles.math.turretUpgrades,
					turret_addsub: 6,
					turret_muldiv: 5
				}
			}
		}
	}, "math");
	assert.ok(upgradedMathStats.baseAttack > baseMathStats.baseAttack);
});
export {};
