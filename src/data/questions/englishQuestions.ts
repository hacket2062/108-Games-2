import type { EnglishQuestion, GradeLevel, SemesterId } from '../../types/game';

type DroneSpec = [string, GradeLevel, SemesterId, 'listen' | 'fill', string, string, string, string[], number, string, string, string];
type SpellSpec = [string, GradeLevel, SemesterId, string, string, string[], string, string];

const DRONE_DATA: DroneSpec[] = [
  // Grade 3
  ['en-3-d1', 3, 'upper', 'listen', '聽音辨字：擊落正確的英文單字機！', 'Elephant', '大象', ['Elephant', 'Rabbit', 'Monkey', 'Tiger'], 0, 'Elephant 是大象，發音以 /ɛ/ 開頭。', '仔細聽開頭的 E-le-phant！', '動物單字'],
  ['en-3-d2', 3, 'upper', 'listen', '聽音辨字：擊落正確的水果單字機！', 'Banana', '香蕉', ['Apple', 'Banana', 'Orange', 'Grape'], 1, 'Banana 是香蕉，注意三個音節 ba-na-na。', '結尾有 na-na 的聲音！', '水果單字'],
  ['en-3-d3', 3, 'upper', 'fill', '句子填空：I ___ a student.', 'I am a student.', '我是一名學生。', ['am', 'is', 'are', 'be'], 0, '第一人稱單數 I 搭配 be 動詞 am。', 'I 永遠和 am 是好朋友！', 'Be 動詞'],
  ['en-3-d4', 3, 'upper', 'fill', '句子填空：What ___ your name?', 'What is your name?', '你叫什麼名字？', ['is', 'are', 'am', 'do'], 0, 'your name 為單數名詞，搭配 is。', '單數主詞配 is。', '問句結構'],
  ['en-3-d5', 3, 'lower', 'listen', '聽音辨字：擊落正確的顏色單字機！', 'Yellow', '黃色', ['Green', 'Purple', 'Yellow', 'Black'], 2, 'Yellow 代表黃色。', '聽起來像「葉樓」的開頭 Y！', '顏色單字'],
  ['en-3-d6', 3, 'lower', 'fill', '句子填空：This is ___ apple.', 'This is an apple.', '這是一顆蘋果。', ['an', 'a', 'two', 'are'], 0, 'apple 以母音 /æ/ 開頭，不定冠詞用 an。', '母音開頭的單字前面用 an！', '冠詞 a/an'],
  ['en-3-d7', 3, 'lower', 'listen', '聽音辨字：擊落正確的教室用品機！', 'Pencil', '鉛筆', ['Ruler', 'Eraser', 'Pencil', 'Book'], 2, 'Pencil 是鉛筆，Pen 是原子筆。', '開頭是 Pen-！', '文具單字'],
  ['en-3-d8', 3, 'lower', 'fill', '句子填空：How old ___ you?', 'How old are you?', '你幾歲？', ['are', 'is', 'am', 'has'], 0, '第二人稱 you 搭配 be 動詞 are。', 'you 搭配 are！', 'Be 動詞'],
  ['en-3-d9', 3, 'upper', 'listen', '聽音辨字：擊落正確的家人稱謂機！', 'Mother', '媽媽', ['Father', 'Mother', 'Sister', 'Brother'], 1, 'Mother 指母親、媽媽。', '以 M 開頭的單字！', '家庭單字'],
  ['en-3-d10', 3, 'lower', 'fill', '句子填空：It is a red ___.', 'It is a red ball.', '它是一顆紅球。', ['ball', 'blue', 'run', 'happy'], 0, '形容詞 red 後面應接名詞 ball。', '找一個名詞當受詞！', '名詞與形容詞'],

  // Grade 4
  ['en-4-d1', 4, 'upper', 'fill', '句子填空：She ___ to school every day.', 'She goes to school every day.', '她每天去上學。', ['goes', 'go', 'going', 'went'], 0, '現在簡單式第三人稱單數 She，動詞 go 須加 es 變 goes。', '主詞是 She，動詞要加 s/es！', '第三人稱單數'],
  ['en-4-d2', 4, 'upper', 'listen', '聽音辨字：擊落正確的天氣單字機！', 'Rainy', '下雨的', ['Sunny', 'Windy', 'Rainy', 'Cloudy'], 2, 'Rainy 表示下雨的（Rain + y）。', '聽看看有沒有 Rain（雨）的聲音！', '天氣形容詞'],
  ['en-4-d3', 4, 'upper', 'fill', '句子填空：Can you ___ a bike?', 'Can you ride a bike?', '你會騎腳踏車嗎？', ['ride', 'rides', 'riding', 'rode'], 0, '助動詞 Can 後面必須接原形動詞 ride。', 'Can 後面用原形動詞！', '助動詞 Can'],
  ['en-4-d4', 4, 'upper', 'listen', '聽音辨字：擊落正確的星期單字機！', 'Wednesday', '星期三', ['Monday', 'Tuesday', 'Wednesday', 'Friday'], 2, 'Wednesday 是星期三，中間的 d 不發音。', '發音像 Wenz-day！', '星期單字'],
  ['en-4-d5', 4, 'lower', 'fill', '句子填空：What ___ you doing now?', 'What are you doing now?', '你現在正在做什麼？', ['are', 'do', 'is', 'can'], 0, '現在進行式結構為 be 動詞 + V-ing，主詞 you 用 are。', '看到 doing 要找 be 動詞！', '現在進行式'],
  ['en-4-d6', 4, 'lower', 'listen', '聽音辨字：擊落正確的場所單字機！', 'Library', '圖書館', ['Hospital', 'Library', 'Park', 'Zoo'], 1, 'Library 是圖書館。', 'Lie-bra-ry！', '場所單字'],
  ['en-4-d7', 4, 'lower', 'fill', '句子填空：There ___ three cats on the sofa.', 'There are three cats on the sofa.', '沙發上有三隻貓。', ['are', 'is', 'am', 'have'], 0, 'three cats 是複數，There be 句型用 There are。', '三隻貓是複數喔！', 'There be 句型'],
  ['en-4-d8', 4, 'lower', 'listen', '聽音辨字：擊落正確的食物單字機！', 'Noodles', '麵條', ['Rice', 'Soup', 'Noodles', 'Salad'], 2, 'Noodles 表示麵條，常用複數形。', '開頭是 N-oo-！', '飲食單字'],
  ['en-4-d9', 4, 'upper', 'fill', '句子填空：He ___ like spiders.', 'He does not like spiders.', '他不喜歡蜘蛛。', ["doesn't", "don't", "isn't", "aren't"], 0, '第三人稱單數 He 的一般動詞否定用 doesn’t。', 'He 搭配 does！', '一般動詞否定'],
  ['en-4-d10', 4, 'lower', 'fill', '句子填空：Where ___ my keys?', 'Where are my keys?', '我的鑰匙在哪裡？', ['are', 'is', 'am', 'does'], 0, 'keys 有 s 為複數名詞，搭配 are。', 'keys 是複數！', '複數疑問句'],

  // Grade 5
  ['en-5-d1', 5, 'upper', 'fill', '句子填空：I ___ to Taipei yesterday.', 'I went to Taipei yesterday.', '我昨天去了台北。', ['went', 'go', 'goes', 'going'], 0, '時間副詞 yesterday 表示過去，go 的過去式是 went。', '看到 yesterday 要用過去式！', '不規則過去式'],
  ['en-5-d2', 5, 'upper', 'listen', '聽音辨字：擊落正確的職業單字機！', 'Scientist', '科學家', ['Doctor', 'Teacher', 'Scientist', 'Pilot'], 2, 'Scientist 意指科學家。', '與 Science 科學相關！', '職業單字'],
  ['en-5-d3', 5, 'upper', 'fill', '句子填空：How ___ water do you need?', 'How much water do you need?', '你需要多少水？', ['much', 'many', 'old', 'tall'], 0, 'water 為不可數名詞，詢問數量用 How much。', '水是不可數名詞喔！', '可數與不可數'],
  ['en-5-d4', 5, 'upper', 'listen', '聽音辨字：擊落正確的季節單字機！', 'Autumn', '秋天', ['Spring', 'Summer', 'Autumn', 'Winter'], 2, 'Autumn（或 Fall）是秋天，字尾 n 不發音。', '發音像 Aw-tum！', '季節單字'],
  ['en-5-d5', 5, 'lower', 'fill', '句子填空：She is ___ than her brother.', 'She is taller than her brother.', '她比她的哥哥高。', ['taller', 'tall', 'tallest', 'more tall'], 0, '句中有 than 表兩者比較，單音節形容詞加 er 變 taller。', '看到 than 就選比較級 -er！', '形容詞比較級'],
  ['en-5-d6', 5, 'lower', 'listen', '聽音辨字：擊落正確的交通工具機！', 'Subway', '捷運／地鐵', ['Airplane', 'Subway', 'Bicycle', 'Scooter'], 1, 'Subway 指地鐵或捷運系統。', 'Sub- 表示在地下！', '交通單字'],
  ['en-5-d7', 5, 'lower', 'fill', '句子填空：We ___ going to visit the museum.', 'We are going to visit the museum.', '我們打算去參觀博物館。', ['are', 'is', 'will', 'did'], 0, 'be going to 表示未來計畫，We 搭配 are。', 'be going to 缺了 be 動詞！', '未來式'],
  ['en-5-d8', 5, 'lower', 'listen', '聽音辨字：擊落正確的科目單字機！', 'Geography', '地理', ['History', 'Music', 'Geography', 'Science'], 2, 'Geography 是地理學科。', 'Geo- 代表地球！', '學科單字'],
  ['en-5-d9', 5, 'upper', 'fill', '句子填空：Did you ___ your homework?', 'Did you finish your homework?', '你完成作業了嗎？', ['finish', 'finished', 'finishes', 'finishing'], 0, '過去式助動詞 Did 後面要接原形動詞 finish。', 'Did 後面動詞變回原形！', '過去式疑問句'],
  ['en-5-d10', 5, 'lower', 'fill', '句子填空：My birthday is ___ October.', 'My birthday is in October.', '我的生日在十月。', ['in', 'on', 'at', 'to'], 0, '月份前使用時間介系詞 in。', '年、季、月前面都用 in！', '時間介系詞'],

  // Grade 6
  ['en-6-d1', 6, 'upper', 'fill', '句子填空：Mount Jade is the ___ mountain in Taiwan.', 'Mount Jade is the highest mountain in Taiwan.', '玉山是台灣最高的山。', ['highest', 'higher', 'high', 'most high'], 0, 'the + 最高級表示三者以上之最，high 的最高級為 highest。', '前面有 the，選最高級 -est！', '形容詞最高級'],
  ['en-6-d2', 6, 'upper', 'listen', '聽音辨字：擊落正確的環保單字機！', 'Recycle', '回收再利用', ['Recycle', 'Pollute', 'Protect', 'Energy'], 0, 'Recycle 意指資源回收再利用。', 'Re- 表示再次循環！', '環境議題單字'],
  ['en-6-d3', 6, 'upper', 'fill', '句子填空：If it ___ tomorrow, we will stay home.', 'If it rains tomorrow, we will stay home.', '如果明天下雨，我們就待在家。', ['rains', 'will rain', 'rained', 'raining'], 0, 'If 引導的條件副詞子句以現在簡單式代替未來式，主詞 it 用 rains。', 'If 子句用現在式代替未來式！', '條件句時態'],
  ['en-6-d4', 6, 'upper', 'listen', '聽音辨字：擊落正確的太空單字機！', 'Astronaut', '太空人', ['Planet', 'Astronaut', 'Rocket', 'Galaxy'], 1, 'Astronaut 是太空人。', 'Astro- 與星辰有關！', '宇宙科技單字'],
  ['en-6-d5', 6, 'lower', 'fill', '句子填空：I have ___ this movie twice.', 'I have seen this movie twice.', '這部電影我看過兩次了。', ['seen', 'saw', 'see', 'seeing'], 0, '現在完成式 have + 過去分詞(p.p.)，see 的 p.p. 是 seen。', 'have 後面接過去分詞！', '現在完成式'],
  ['en-6-d6', 6, 'lower', 'listen', '聽音辨字：擊落正確的感受單字機！', 'Excited', '興奮的', ['Bored', 'Worried', 'Excited', 'Surprised'], 2, 'Excited 形容人感到興奮激動。', 'Ex-ci-ted！', '情緒形容詞'],
  ['en-6-d7', 6, 'lower', 'fill', '句子填空：She enjoys ___ English songs.', 'She enjoys singing English songs.', '她喜歡唱英文歌。', ['singing', 'to sing', 'sing', 'sang'], 0, '動詞 enjoy 後面必須接動名詞 V-ing。', 'enjoy + V-ing 是必考搭配！', '動名詞用法'],
  ['en-6-d8', 6, 'lower', 'listen', '聽音辨字：擊落正確的探索單字機！', 'Adventure', '冒險', ['Adventure', 'Festival', 'Vacation', 'Culture'], 0, 'Adventure 表示冒險旅程。', 'Ad-ven-ture！', '旅遊冒險單字'],
  ['en-6-d9', 6, 'upper', 'fill', '句子填空：The book was ___ by a famous writer.', 'The book was written by a famous writer.', '這本書是一位知名作家寫的。', ['written', 'wrote', 'write', 'writing'], 0, '被動語態 be + p.p.，write 的過去分詞是 written。', '被動語態用 was + p.p.！', '被動語態'],
  ['en-6-d10', 6, 'lower', 'fill', '句子填空：Although he was tired, ___ he kept running.', 'Although he was tired, he kept running.', '雖然他很累，但他還是繼續跑。', ['(不填)', 'but', 'so', 'because'], 0, '英文中 Although 與 but 不可同時出現在同一個句子裡。', '英文的雖然跟但是不能同時出現喔！', '連接詞規則'],
];

const SPELL_DATA: SpellSpec[] = [
  // Grade 3
  ['en-3-sp1', 3, 'upper', 'APPLE', '蘋果', ['O', 'M'], 'APPLE 拼法為 A-P-P-L-E，注意兩個 P。', '水果拼字'],
  ['en-3-sp2', 3, 'upper', 'TIGER', '老虎', ['A', 'O'], 'TIGER 拼法為 T-I-G-E-R。', '動物拼字'],
  ['en-3-sp3', 3, 'lower', 'WATER', '水', ['O', 'N'], 'WATER 拼法為 W-A-T-E-R。', '生活拼字'],
  ['en-3-sp4', 3, 'lower', 'HAPPY', '快樂的', ['E', 'I'], 'HAPPY 拼法為 H-A-P-P-Y。', '情緒拼字'],
  // Grade 4
  ['en-4-sp1', 4, 'upper', 'SUNNY', '晴朗的', ['A', 'O'], 'SUNNY 是 SUN 雙寫 N 加 Y。', '天氣拼字'],
  ['en-4-sp2', 4, 'upper', 'ROBOT', '機器人', ['A', 'E'], 'ROBOT 拼法為 R-O-B-O-T。', '科技拼字'],
  ['en-4-sp3', 4, 'lower', 'MUSIC', '音樂', ['K', 'A'], 'MUSIC 拼法為 M-U-S-I-C。', '學科拼字'],
  ['en-4-sp4', 4, 'lower', 'TRAIN', '火車', ['E', 'O'], 'TRAIN 拼法為 T-R-A-I-N，ai 發長音。', '交通拼字'],
  // Grade 5
  ['en-5-sp1', 5, 'upper', 'PLANET', '行星', ['O', 'I'], 'PLANET 拼法為 P-L-A-N-E-T。', '太空拼字'],
  ['en-5-sp2', 5, 'upper', 'FOREST', '森林', ['A', 'U'], 'FOREST 拼法為 F-O-R-E-S-T。', '自然拼字'],
  ['en-5-sp3', 5, 'lower', 'FRIEND', '朋友', ['A', 'O'], 'FRIEND 拼法為 F-R-I-E-N-D，注意 ie 順序。', '生活拼字'],
  ['en-5-sp4', 5, 'lower', 'SPRING', '春天', ['E', 'A'], 'SPRING 拼法為 S-P-R-I-N-G。', '季節拼字'],
  // Grade 6
  ['en-6-sp1', 6, 'upper', 'GALAXY', '銀河系', ['E', 'O'], 'GALAXY 拼法為 G-A-L-A-X-Y。', '宇宙拼字'],
  ['en-6-sp2', 6, 'upper', 'ENERGY', '能源', ['A', 'I'], 'ENERGY 拼法為 E-N-E-R-G-Y。', '科學拼字'],
  ['en-6-sp3', 6, 'lower', 'FUTURE', '未來', ['A', 'O'], 'FUTURE 拼法為 F-U-T-U-R-E。', '時間拼字'],
  ['en-6-sp4', 6, 'lower', 'HEROIC', '英勇的', ['A', 'U'], 'HEROIC 由 HERO 加上 IC 構成。', '進階形容詞'],
];

export const ENGLISH_QUESTIONS: EnglishQuestion[] = [
  ...DRONE_DATA.map(([id, grade, semester, mode, prompt, speakText, zhMeaning, choices, correctIndex, explanation, hint, knowledgeTag]): EnglishQuestion => ({
    id,
    grade,
    semester,
    subject: 'english',
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
      correctIndex,
    },
  })),
  ...SPELL_DATA.map(([id, grade, semester, word, zhMeaning, distractorLetters, explanation, knowledgeTag]): EnglishQuestion => ({
    id,
    grade,
    semester,
    subject: 'english',
    type: 'spell',
    prompt: `母艦拼字充能！依序射擊字母拼出「${zhMeaning}」`,
    answer: word,
    explanation,
    hint: `開頭字母是 ${word[0]}，共有 ${word.length} 個字母！`,
    knowledgeTag,
    payload: {
      mode: 'spell',
      speakText: word.toLowerCase(),
      zhMeaning,
      word,
      distractorLetters,
    },
  })),
];
