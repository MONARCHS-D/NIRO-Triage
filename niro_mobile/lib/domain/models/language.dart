/// Regional Indic language descriptors and simulated speech data
class LanguageOption {
  final String code;
  final String name;
  final String nativeName;
  final String scriptSnippet;
  final String sampleTranscript;
  final String sampleTranslation;
  final List<String> sampleSymptoms;

  const LanguageOption({
    required this.code,
    required this.name,
    required this.nativeName,
    required this.scriptSnippet,
    required this.sampleTranscript,
    required this.sampleTranslation,
    required this.sampleSymptoms,
  });

  static const List<LanguageOption> supportedLanguages = [
    LanguageOption(
      code: 'or',
      name: 'Odia',
      nativeName: 'ଓଡ଼ିଆ',
      scriptSnippet: 'ମୋତେ ତିନି ଦିନ ହେଲା ଜ୍ୱର ଏବଂ ନିଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ହେଉଛି...',
      sampleTranscript:
          'ମୋତେ ତିନି ଦିନ ହେଲା ପ୍ରବଳ ଜ୍ୱର ଅଛି ଏବଂ ଛାତିରେ ଭାରୀ ଲାଗୁଛି। ଶୋଇବା ବେଳେ ନିଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ହେଉଛି।',
      sampleTranslation:
          'I have had high fever for three days with chest heaviness. Difficulty breathing when lying down.',
      sampleSymptoms: [
        'High fever (3 days)',
        'Difficulty breathing (Dyspnea)',
        'Chest heaviness'
      ],
    ),
    LanguageOption(
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      scriptSnippet: 'मुझे दो दिन से पेट में तेज दर्द और उल्टी जैसा लग रहा है...',
      sampleTranscript:
          'मुझे पिछले दो दिन से ऊपरी पेट में बहुत तेज दर्द हो रहा है और खाना खाने के बाद उल्टी जैसा लगता है।',
      sampleTranslation:
          'I have had severe upper abdominal pain for the past two days and feel nauseous after meals.',
      sampleSymptoms: [
        'Epigastric pain (2 days)',
        'Nausea after food',
        'Loss of appetite'
      ],
    ),
    LanguageOption(
      code: 'bn',
      name: 'Bengali',
      nativeName: 'বাংলা',
      scriptSnippet: 'আমার গতকাল থেকে খুব সর্দি, কাশি এবং শরীরে ব্যথা...',
      sampleTranscript:
          'আমার গতকাল রাত থেকে হঠাৎ খুব কাশি, মাথা ব্যথা এবং সামান্য জ্বর শুরু হয়েছে। শরীর খুব দুর্বল লাগছে।',
      sampleTranslation:
          'Since yesterday night, I suddenly have cough, headache, and mild fever. Feeling very weak.',
      sampleSymptoms: [
        'Acute cough',
        'Mild fever',
        'Headache & generalized weakness'
      ],
    ),
    LanguageOption(
      code: 'ta',
      name: 'Tamil',
      nativeName: 'தமிழ்',
      scriptSnippet: 'எனக்கு நான்கு நாட்களாக மூட்டு வலி மற்றும் காய்ச்சல்...',
      sampleTranscript:
          'எனக்கு நான்கு நாட்களாக கடுமையான மூட்டு வலி, உடல் சோர்வு மற்றும் நடுக்கத்துடன் காய்ச்சல் உள்ளது.',
      sampleTranslation:
          'I have had severe joint pain, bodily fatigue, and fever with chills for four days.',
      sampleSymptoms: [
        'Fever with chills',
        'Severe arthralgia (joint pain)',
        'Fatigue'
      ],
    ),
    LanguageOption(
      code: 'te',
      name: 'Telugu',
      nativeName: 'తెలుగు',
      scriptSnippet: 'నాకు మూడు రోజుల నుండి గొంతు నొప్పి మరియు దగ్గు...',
      sampleTranscript:
          'నాకు మూడు రోజుల నుండి గొంతులో తీవ్రమైన నొప్పి ఉంది, ఆహారం మింగడం కష్టంగా ఉంది మరియు పొడి దగ్గు వస్తోంది.',
      sampleTranslation:
          'I have severe throat pain for three days, difficulty swallowing food, and dry cough.',
      sampleSymptoms: [
        'Sore throat / Pharyngitis',
        'Dysphagia (difficulty swallowing)',
        'Dry cough'
      ],
    ),
    LanguageOption(
      code: 'mr',
      name: 'Marathi',
      nativeName: 'मराठी',
      scriptSnippet: 'मला दोन दिवसांपासून ताप आणि अंगदुखीचा त्रास होत आहे...',
      sampleTranscript:
          'मला दोन दिवसांपासून अचानक ताप आला आहे, अंगदुखी तीव्र आहे आणि खूप अशक्तपणा जाणवत आहे.',
      sampleTranslation:
          'I have sudden onset fever for two days, severe body aches, and marked weakness.',
      sampleSymptoms: [
        'Acute fever',
        'Severe body ache',
        'Weakness'
      ],
    ),
    LanguageOption(
      code: 'en',
      name: 'English',
      nativeName: 'English',
      scriptSnippet: 'I have had persistent dry cough and low-grade fever...',
      sampleTranscript:
          'I have had persistent dry cough and low-grade fever for four days with occasional chest discomfort.',
      sampleTranslation:
          'Persistent dry cough, low-grade fever for four days, and occasional chest discomfort.',
      sampleSymptoms: [
        'Persistent dry cough',
        'Low-grade fever',
        'Occasional chest discomfort'
      ],
    ),
  ];
}
