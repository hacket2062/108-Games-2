import type {ChineseQuestion,EnglishQuestion,GradeLevel,MathQuestion,ScienceQuestion,SemesterId} from '../../types/game';

// Original offline practice content. Numerical variants are counted as variants,
// not as separately authored curriculum standards or teacher-reviewed questions.
export const ADVENTURE_MATH:MathQuestion[]=[];
for(const grade of [3,4,5,6] as const)for(const semester of ['upper','lower'] as const)for(let i=0;i<40;i++){
 const n=i%5+1+(semester==='lower'?5:0),family=Math.floor(i/5);let prompt='',answer=0,explanation='',tag='';
 const build=(p:string,a:number,e:string,t:string)=>{prompt=p;answer=a;explanation=e;tag=t;};
 if(grade===3){
  const a=128+n*17,b=63+n*8;
  if(family===0)build(`圖書角有 ${a} 本書，又收到 ${b} 本，共有幾本？`,a+b,`${a}＋${b}＝${a+b} 本。`,'三位數加法');
  if(family===1)build(`園遊會準備 ${a+200} 張票，賣出 ${b} 張，剩幾張？`,a+200-b,`${a+200}－${b}＝${a+200-b} 張。`,'退位減法');
  if(family===2)build(`每袋有 ${n+3} 顆彈珠，${n+5} 袋共有幾顆？`,(n+3)*(n+5),`每袋顆數乘袋數：${n+3}×${n+5}＝${(n+3)*(n+5)}。`,'乘法應用');
  if(family===3)build(`${(n+4)*6} 枝彩筆平均分給 6 人，每人幾枝？`,n+4,`${(n+4)*6}÷6＝${n+4}。`,'除法應用');
  if(family===4)build(`活動從 ${n+8} 時開始，經過 2 小時，結束時是幾時？`,n+10,`${n+8}＋2＝${n+10} 時。`,'時間計算');
  if(family===5)build(`一條緞帶 ${n+2} 公尺又 25 公分，共幾公分？`,(n+2)*100+25,`1 公尺是 100 公分，${n+2}×100＋25＝${(n+2)*100+25}。`,'長度換算');
  if(family===6)build(`正方形展示板每邊 ${n+6} 公分，四邊合計幾公分？`,(n+6)*4,`正方形周長＝邊長×4＝${(n+6)*4}。`,'正方形周長');
  if(family===7)build(`小隊帶了 500 元，買 ${n+2} 本每本 25 元的筆記本，剩幾元？`,500-(n+2)*25,`先算花費 ${n+2}×25＝${(n+2)*25}，再用 500 減去花費。`,'兩步驟應用');
 }else if(grade===4){
  if(family===0)build(`長方形花圃長 ${n+9} 公尺、寬 ${n+3} 公尺，周長幾公尺？`,(n*2+12)*2,`（長＋寬）×2＝（${n+9}＋${n+3}）×2＝${(n*2+12)*2}。`,'長方形周長');
  if(family===1)build(`長 ${n+8} 公分、寬 ${n+2} 公分的卡紙，面積幾平方公分？`,(n+8)*(n+2),`長×寬＝${n+8}×${n+2}＝${(n+8)*(n+2)}。`,'長方形面積');
  if(family===2)build(`學校訂 ${n+12} 箱果汁，每箱 24 瓶，共幾瓶？`,(n+12)*24,`${n+12}×24＝${(n+12)*24}。`,'二位數乘法');
  if(family===3)build(`${(n+15)*12} 張照片每頁貼 12 張，可貼滿幾頁？`,n+15,`${(n+15)*12}÷12＝${n+15}。`,'整數除法');
  if(family===4)build(`兩段繩子分別長 ${n+2}.3 公尺與 1.4 公尺，合計幾公尺？`,Number((n+3.7).toFixed(1)),`小數點對齊：${n+2}.3＋1.4＝${(n+3.7).toFixed(1)}。`,'小數加法');
  if(family===5)build(`自行車騎了 ${n+2} 公里又 150 公尺，共幾公尺？`,(n+2)*1000+150,`1 公里＝1000 公尺，所以是 ${(n+2)*1000+150} 公尺。`,'長度單位換算');
  if(family===6)build(`水壺裝有 ${n+1} 公升又 250 毫升，共幾毫升？`,(n+1)*1000+250,`1 公升＝1000 毫升，${n+1}×1000＋250＝${(n+1)*1000+250}。`,'容量換算');
  if(family===7)build(`四人各募得 ${n*10+30} 元、40 元、50 元、60 元，合計幾元？`,n*10+180,`將四人的金額相加：${n*10+30}＋40＋50＋60＝${n*10+180}。`,'資料加總');
 }else if(grade===5){
  if(family===0)build(`底 ${n+8} 公分、高 6 公分的三角形，面積幾平方公分？`,(n+8)*3,`三角形面積＝底×高÷2＝${n+8}×6÷2＝${(n+8)*3}。`,'三角形面積');
  if(family===1)build(`平行四邊形底 ${n+7} 公分、高 ${n+2} 公分，面積幾平方公分？`,(n+7)*(n+2),`底×高＝${n+7}×${n+2}＝${(n+7)*(n+2)}。`,'平行四邊形面積');
  if(family===2)build(`長方體積木長 ${n+3}、寬 4、高 3 公分，體積幾立方公分？`,(n+3)*12,`長×寬×高＝${n+3}×4×3＝${(n+3)*12}。`,'長方體體積');
  if(family===3)build(`每公尺緞帶 12 元，買 ${n+1}.5 公尺需幾元？`,(n+1.5)*12,`${n+1}.5×12＝${(n+1.5)*12} 元。`,'小數乘法');
  if(family===4)build(`分數 ${n}/12 等值於幾分之 24？請填「分子」的數字。`,n*2,`分母 12 乘 2 變 24，分子也乘 2：${n}×2＝${n*2}。`,'擴分');
  if(family===5)build(`${(n+4)*6} 顆糖平均分裝，每袋 ${n+4} 顆，可裝幾袋？`,6,`${(n+4)*6}÷${n+4}＝6。`,'除法應用');
  if(family===6)build(`一壺 ${n+2} 公升的飲料，喝掉一半後剩幾公升？`,(n+2)/2,`${n+2}÷2＝${(n+2)/2}。`,'分數與整數');
  if(family===7)build(`梯形上底 ${n+3}、下底 ${n+7}、高 4 公分，面積幾平方公分？`,(n*2+10)*2,`（上底＋下底）×高÷2＝（${n+3}＋${n+7}）×4÷2＝${(n*2+10)*2}。`,'梯形面積');
 }else{
  if(family===0)build(`書包原價 ${n*100+500} 元，打八折後售價幾元？`,(n*100+500)*.8,`八折是原價的 0.8 倍，${n*100+500}×0.8＝${(n*100+500)*.8}。`,'百分率應用');
  if(family===1)build(`走 ${n+3} 小時共走 ${(n+3)*4} 公里，平均每小時幾公里？`,4,`速率＝距離÷時間＝${(n+3)*4}÷${n+3}＝4。`,'速率');
  if(family===2)build(`紅珠與藍珠數量比 2：3，共 ${5*(n+4)} 顆，紅珠幾顆？`,2*(n+4),`共 5 份，每份 ${n+4} 顆，紅珠 2 份是 ${2*(n+4)} 顆。`,'比與比值');
  if(family===3)build(`圓半徑 ${n+2} 公分，以圓周率 3.14 計算，直徑幾公分？`,(n+2)*2,`直徑是半徑的 2 倍：${n+2}×2＝${(n+2)*2}。`,'圓的構造');
  if(family===4)build(`四次投球得分為 ${n+4}、${n+6}、${n+8}、${n+10}，平均幾分？`,n+7,`總分 ${n*4+28} 除以 4，平均 ${n+7} 分。`,'平均數');
  if(family===5)build(`地圖比例尺 1：1000，圖上 ${n+2} 公分代表實際幾公尺？`,(n+2)*10,`實際長度＝${n+2}×1000 公分，再除以 100，得 ${(n+2)*10} 公尺。`,'比例尺');
  if(family===6)build(`長方體容器底面積 ${n*10+40} 平方公分、高 5 公分，容積幾立方公分？`,(n*10+40)*5,`底面積×高＝${n*10+40}×5＝${(n*10+40)*5}。`,'柱體體積');
  if(family===7)build(`全班 ${n*5+20} 人，其中五分之一參加合唱團，有幾人？`,n+4,`${n*5+20}÷5＝${n+4} 人。`,'分率應用');
 }
 const wrong=[answer+1,answer+2,Math.max(0,answer-1)].map(v=>String(Number(v.toFixed(2))));const correct=String(Number(answer.toFixed(2)));const options=Array.from(new Set([correct,...wrong]));while(options.length<4)options.push(String(answer+options.length+5));
 ADVENTURE_MATH.push({id:`adv-ma-${grade}-${semester}-${i}`,subject:'math',grade,semester,type:family===0&&grade>=5?'geometry':'calc',prompt,answer:correct,explanation,hint:`先找出題目中的已知條件，再用「${tag}」的方法。`,knowledgeTag:tag,payload:{formulaShield:tag,options,correctIndex:0}});
}

type Reading=[string,string,string[],string];
const readings:Record<GradeLevel,Reading[]>={
  3:[['小安把借來的書包好，準時歸還。','哪個詞最適合形容小安？',['守信','驕傲','急躁','貪心'],'遵守歸還時間，是守信用的行為。'],['雨停後，麻雀又跳到樹枝上唱歌。','事情發生的順序是哪個？',['雨停後麻雀唱歌','麻雀唱歌後下雨','先折樹枝再唱歌','雨一直沒有停'],'「雨停後」說明麻雀唱歌在雨停之後。'],['弟弟跌倒了，姐姐扶他起來並拍拍灰塵。','姐姐的行為表現出什麼？',['關心','嫉妒','膽小','生氣'],'扶起弟弟並拍灰塵，表現對他的關心。'],['我先洗手，再拿起飯碗。','「再」在這裡表示什麼？',['動作先後','兩物比較','說明原因','表達相反'],'先洗手，接著拿碗；「再」連接下一個動作。'],['風把窗簾吹得輕輕搖擺。','句子中的「輕輕」形容什麼？',['搖擺的樣子','窗簾的價格','房間的大小','風的顏色'],'「輕輕」修飾搖擺，說明動作輕柔。'],['小路像一條長長的絲帶，繞過田野。','作者把小路比成什麼？',['絲帶','田野','天空','河水'],'句中的「像一條長長的絲帶」是比喻。']],
  4:[['雖然比賽落後，小隊仍互相鼓勵，直到終點。','哪句最接近短文主旨？',['不輕易放棄','只重視獎品','落後就離開','每人只顧自己'],'即使落後仍努力，是不放棄的表現。'],['小芸發現植物朝窗戶彎去，便每天記下葉子的方向。','小芸採用什麼方法了解植物？',['觀察記錄','隨意猜測','照抄故事','停止照顧'],'每天記下方向，是持續觀察並記錄。'],['爸爸說：「這座公園是城市的肺。」','這句話主要強調公園什麼特色？',['讓環境更舒適','有真正的肺臟','只有醫生能進入','必須戴口罩玩'],'把公園比作肺，是強調綠地對城市環境的重要性。'],['小凱為了趕上公車，連早餐也沒吃。','小凱沒吃早餐的原因是什麼？',['趕公車','不喜歡公車','午餐太多','學校放假'],'「為了趕上公車」直接說明原因。'],['清晨的市場漸漸熱鬧，叫賣聲一聲接著一聲。','最適合描寫這個場景的詞是？',['此起彼落','鴉雀無聲','空無一人','萬籟俱寂'],'聲音接續響起，可以用「此起彼落」。'],['班長先聽兩方說法，才提出輪流使用球場的辦法。','班長的處理方式有什麼優點？',['兼顧雙方','只偏袒朋友','拒絕溝通','立刻責罵'],'先聽雙方，再安排輪流，兼顧了兩邊需求。']],
  5:[['作者先寫溪水清澈，再寫垃圾增加，最後呼籲大家減少塑膠袋。','文章最後一段的主要作用是什麼？',['提出行動呼籲','介紹人物外貌','交代比賽結果','增加無關笑話'],'「呼籲大家減少」是在邀請讀者採取行動。'],['小庭聽完建議後修正作品，第二次展示更完整。','哪個成語最適合形容小庭？',['從善如流','固執己見','自相矛盾','守株待兔'],'願意接受合理建議並修正，符合從善如流。'],['樹影在牆上跳舞，風兒敲著門。','這句主要使用什麼修辭？',['擬人','設問','排比','引用'],'讓樹影跳舞、風敲門，是賦予事物人的動作。'],['調查表顯示，受訪的二十人中有十二人走路上學。','哪個說法有資料支持？',['受訪者過半走路上學','全校都走路上學','每人住得一樣遠','騎車的人一定最少'],'十二超過二十的一半，但不能擴大推論全校。'],['「不只速度重要，方向也很重要。」','「不只……也……」連接什麼關係？',['補充另一重點','表示完全相反','表示唯一原因','表示先後時間'],'這組連接詞在原重點上補充另一個重點。'],['同學說小河的水「會發光」，原來是夕陽倒映水面。','「發光」實際描寫什麼？',['水面反映夕陽','河水正在燃燒','河底裝了電燈','水變成金屬'],'後文「夕陽倒映」解釋了水面亮光的來源。']],
  6:[['文章列出節水前後的用水量，再說明節水器的效果。','列出數據主要有什麼作用？',['讓論點有依據','保證永遠不缺水','取代所有解釋','讓每個人想法相同'],'前後數據可支持效果比較，不能保證未來。'],['社群貼文說某地明天停課，但沒有日期或正式來源。','較合適的閱讀態度是什麼？',['查明日期與官方公告','立刻轉傳給所有人','只看標題就相信','相信轉傳人數最多的'],'缺少日期和來源時，應先查證再判斷。'],['有人認為校服方便，也有人重視自由選衣。文章最後建議討論共同規則。','作者的立場最接近什麼？',['理解差異並尋求共識','否定所有人的意見','只准一方發言','認為討論沒有用'],'先呈現不同需求，再提共同規則，是尋求共識。'],['「他口頭說不在意，手卻一直捏著報名表。」','從動作可以推想他可能怎樣？',['其實有些緊張','確定已經獲獎','完全沒有感覺','正在撕掉所有文件'],'一直捏報名表可能透露緊張，但不能推斷已獲獎。'],['作者把整座山比作沉睡的巨人，並描寫山脊像肩膀。','兩個比喻共同突顯什麼？',['山的巨大輪廓','山裡真的住巨人','所有山都會睡覺','山只有一種顏色'],'巨人與肩膀的形象，讓讀者想像山體輪廓。'],['甲文說種樹能改善環境，乙文提醒仍須考慮樹種與空間。','綜合兩文，較周全的結論是什麼？',['種樹有益也需適地選種','任何地方都種同一樹種','兩篇必有一篇全錯','不用照顧也一定長好'],'兩文分別指出益處和條件，可整合成較完整觀點。']],
};
export const ADVENTURE_CHINESE:ChineseQuestion[]=([3,4,5,6] as const).flatMap(grade=>readings[grade].map(([story,ask,options,explanation],i)=>({id:`adv-ch-${grade}-${i}`,grade,semester:i<3?'upper':'lower',subject:'chinese',type:'slash',prompt:`${story}\n${ask}`,answer:options[0],explanation,hint:'先找短文的關鍵句，選擇有文字支持的答案。',knowledgeTag:i%2?'閱讀推論':'閱讀理解',payload:{mode:'slash',options,correctIndex:0}})));

type Word=[string,string,string];
const words:Record<GradeLevel,Word[]>={
  3:[['rabbit','兔子','The ____ has long ears.'],['turtle','烏龜','The ____ walks slowly.'],['milk','牛奶','I drink ____ with breakfast.'],['bread','麵包','I eat ____ for breakfast.'],['pencil','鉛筆','I write with a ____.'],['window','窗戶','Please open the ____.'],['sister','姊姊或妹妹','My ____ is a girl in my family.'],['yellow','黃色','The banana is ____.']],
  4:[['library','圖書館','We read books in the ____.'],['hospital','醫院','The doctor works in a ____.'],['umbrella','雨傘','Take an ____ on a rainy day.'],['breakfast','早餐','I eat ____ in the morning.'],['Monday','星期一','____ comes after Sunday.'],['swimming','游泳','We go ____ in the pool.'],['thirsty','口渴的','I am ____ and need water.'],['behind','在後面','The garden is ____ the house.']],
  5:[['mountain','山','We hike up the ____.'],['island','島嶼','An ____ has water around it.'],['carefully','小心地','Please cross the road ____.'],['recycle','回收','We ____ used paper.'],['museum','博物館','We see old objects in a ____.'],['weather','天氣','The ____ is sunny today.'],['practice','練習','I ____ the piano every day.'],['friendly','友善的','She smiles and is ____ to others.']],
  6:[['protect','保護','We should ____ wild animals.'],['environment','環境','Keep our ____ clean.'],['festival','節慶','We celebrate a ____ together.'],['invitation','邀請函','He sent me an ____ to his party.'],['important','重要的','Clean water is ____ to us.'],['remember','記得','Please ____ to bring your book.'],['different','不同的','These two pictures are ____.'],['teamwork','團隊合作','Good ____ helps us finish together.']],
};
export const ADVENTURE_ENGLISH:EnglishQuestion[]=([3,4,5,6] as const).flatMap(grade=>words[grade].flatMap(([word,zhMeaning,sentence],i)=>{
 const choices=[word,...[1,2,3].map(offset=>words[grade][(i+offset)%8][0])];
 return (['listen','fill'] as const).map(mode=>({id:`adv-en-${grade}-${i}-${mode}`,grade,semester:(i<4?'upper':'lower') as SemesterId,subject:'english' as const,type:mode,prompt:mode==='listen'?'聽單字，選出相符的英文。':sentence,answer:word,explanation:`${word} 的意思是「${zhMeaning}」。完整句子：${sentence.replace('____',word)}`,hint:mode==='listen'?'可再聽一次，留意開頭的聲音。':`從句子情境尋找「${zhMeaning}」的英文。`,knowledgeTag:mode==='listen'?'生活單字聽辨':'情境字彙',payload:{mode,speakText:mode==='listen'?word:sentence.replace('____',word),zhMeaning,choices:[...choices],correctIndex:0}}));
}));

type ScienceSet=[string,string,string,string,string,string];
const scienceSets:Record<GradeLevel,ScienceSet[]>={
  3:[['植物的根','紅蘿蔔','白蘿蔔','高麗菜葉','番茄果實','紅蘿蔔與白蘿蔔的食用部位是根。'],['可被一般磁鐵吸引','鐵釘','鋼製迴紋針','木片','塑膠尺','鐵與含鐵的鋼製品可被一般磁鐵吸引。'],['固體','石頭','積木','空氣','水','石頭與積木有較固定的形狀，屬於固體。'],['液體','水','食用油','石子','氧氣','水與油會流動並隨容器改變形狀，屬液體。'],['光源','點亮的燈泡','燃燒的燭火','月亮','鏡子','燈泡與燭火自行發光，月亮與鏡子主要反射光。'],['動物','蝴蝶','蝸牛','榕樹','向日葵','蝴蝶與蝸牛是動物；榕樹與向日葵是植物。']],
  4:[['昆蟲','螞蟻','蝴蝶','蜘蛛','蝸牛','螞蟻與蝴蝶的成蟲有六隻腳；蜘蛛有八隻腳，蝸牛不是昆蟲。'],['鳥類','麻雀','鴿子','蝙蝠','蝴蝶','麻雀與鴿子是鳥類；能飛不一定就是鳥類。'],['水的固態','冰塊','雪','水蒸氣','液態雨水','冰與雪是水的固態。'],['容易導電的材料','銅線','鐵釘','乾木棒','塑膠片','銅與鐵是金屬導體；乾木與塑膠不易導電。'],['一天中的影子觀察','記錄時間','記錄影子方向','每次換地點不記錄','只憑記憶猜測','固定條件並記錄時間、方向，有助比較影子的變化。'],['幫助保護水域的做法','不亂丟垃圾','減少汙水排入','把油倒進水溝','丟塑膠袋進河裡','減少垃圾與汙水，有助維護水域環境。']],
  5:[['熱傳導較快的常見材料','銅湯匙','鐵湯匙','木筷子','塑膠湯匙','金屬通常比木與塑膠容易傳熱，注意不要用手碰熱器具。'],['種子傳播方式','蒲公英隨風飄','蒼耳附著動物','所有種子都靠水','種子都不能移動','不同植物的種子構造適合不同傳播方式。'],['完整電路需要的條件','電源','連續閉合的導電路徑','只放一顆燈泡','把所有導線剪斷','電源和閉合路徑是讓電路運作的必要條件。'],['可再生能源','太陽能','風能','煤','石油','太陽與風能持續補充；煤與石油形成很慢。'],['觀察月相的方法','記錄日期','畫下亮面形狀','認為每晚完全相同','只看一次就下結論','連續記錄日期與亮面形狀，可以比較月相變化。'],['食物鏈中的生產者','青草','藻類','青蛙','老鷹','青草和藻類能利用光製造養分，是生產者。']],
  6:[['減少摩擦的方法','在輪軸適量潤滑','使用滾輪搬物','讓表面更粗糙','加壓粗糙接觸面','潤滑與改用滾動，通常可減少運動阻力。'],['可改變物體運動的力','推力','拉力','顏色','名稱','推與拉是力，能改變物體的運動。'],['簡單機械','槓桿','滑輪','彩色貼紙','影子','槓桿與滑輪是常見的簡單機械。'],['公平比較紙飛機飛行距離的控制條件','相同起飛位置','相近的投擲方式','每次換不同風向','距離不用測量','固定起點與投擲方式，更容易比較要研究的變因。'],['天氣紀錄的資料','氣溫','雨量','鞋子顏色','鉛筆品牌','氣溫與雨量是常見的天氣觀測資料。'],['生態保育的做法','保留生物棲地','不任意放生外來種','任意捕捉野生動物','破壞繁殖地','保留棲地並避免引入外來種，有助保育。']],
};
export const ADVENTURE_SCIENCE:ScienceQuestion[]=([3,4,5,6] as const).flatMap(grade=>scienceSets[grade].map(([tag,a,b,c,d,explanation],i)=>({id:`adv-sc-${grade}-${i}`,grade,semester:i<3?'upper':'lower',subject:'science',type:'dish',prompt:`知識分類挑戰：找出兩項符合「${tag}」的卡片。`,answer:`${a}、${b}`,explanation,hint:'先比較每張卡片的特徵，再找出符合分類的兩項。',knowledgeTag:tag,payload:{dishName:`${tag}研究拼盤`,orderRequirement:`選兩項「${tag}」卡片。遊戲配方設定：中火、中性；此步驟是幻想玩法，不是真實實驗或食譜。`,neededCount:2,ingredients:[a,b,c,d].map((name,j)=>({id:`adv-sc-${grade}-${i}-${j}`,name,categoryTag:tag,color:['#76b68b','#70a7cf','#c28e84','#9b86bd'][j],accent:'#e3eef5',isCorrect:j<2,...(j>=2?{wrongReason:`這項不符合「${tag}」；${explanation}`}:{})})),targetTempZone:'simmer',targetTempLabel:'遊戲配方：中火',targetPh:'neutral',targetPhLabel:'遊戲配方：中性',effectStyle:'nature'}})));
