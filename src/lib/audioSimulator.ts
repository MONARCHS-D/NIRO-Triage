export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  sampleTranscript: string;
  sampleTranslation: string;
  sampleSymptoms: { name: string; duration: string; severity: 'MILD' | 'MODERATE' | 'SEVERE' }[];
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Oriya',
    sampleTranscript: 'ମୋତେ ତିନି ଦିନ ହେଲା ଜ୍ୱର ଏବଂ ମୁଣ୍ଡ ବେଥା ଲାଗିଛି। ଆଜି ସକାଳୁ ଚାଲିଲା ବେଳେ ନିଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ହେଉଛି...',
    sampleTranslation: 'I have had fever and headache for three days. Since this morning I experience shortness of breath while walking...',
    sampleSymptoms: [
      { name: 'Shortness of breath', duration: '1 day', severity: 'SEVERE' },
      { name: 'High fever', duration: '3 days', severity: 'MODERATE' },
      { name: 'Headache', duration: '3 days', severity: 'MILD' },
    ],
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    sampleTranscript: 'मुझे तीन दिनों से तेज बुखार और खांसी है, और सीने में भारीपन महसूस हो रहा है। लेटने पर सांस फूलती है...',
    sampleTranslation: 'I have had high fever and cough for three days, and feel chest heaviness. Shortness of breath worsens when lying down...',
    sampleSymptoms: [
      { name: 'Chest heaviness', duration: '2 days', severity: 'MODERATE' },
      { name: 'High fever', duration: '3 days', severity: 'MODERATE' },
      { name: 'Shortness of breath (orthopnea)', duration: '1 day', severity: 'SEVERE' },
    ],
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    sampleTranscript: 'আমার তিন দিন ধরে সর্দি, হাঁচি এবং হালকা জ্বর হচ্ছে। খুব দুর্বল লাগছে...',
    sampleTranslation: 'I have had cold, sneezing, and low-grade fever for three days. Feeling very weak...',
    sampleSymptoms: [
      { name: 'Runny nose / coryza', duration: '3 days', severity: 'MILD' },
      { name: 'Low-grade fever', duration: '3 days', severity: 'MILD' },
      { name: 'General malaise', duration: '3 days', severity: 'MILD' },
    ],
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    sampleTranscript: 'எனக்கு மூன்று நாட்களாக கடுமையான காய்ச்சல் மற்றும் இருமல் உள்ளது, சுவாசிப்பதில் சிரமம் ஏற்படுகிறது...',
    sampleTranslation: 'I have severe fever and cough for three days, causing difficulty in breathing...',
    sampleSymptoms: [
      { name: 'Severe fever', duration: '3 days', severity: 'SEVERE' },
      { name: 'Cough', duration: '3 days', severity: 'MODERATE' },
      { name: 'Breathing difficulty', duration: '1 day', severity: 'SEVERE' },
    ],
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    sampleTranscript: 'నాకు మూడు రోజులుగా జ్వరం మరియు దగ్గు ఉంది, శ్వాస తీసుకోవడంలో ఇబ్బందిగా ఉంది...',
    sampleTranslation: 'I have fever and cough for three days, and finding it difficult to breathe properly...',
    sampleSymptoms: [
      { name: 'Fever', duration: '3 days', severity: 'MODERATE' },
      { name: 'Cough', duration: '3 days', severity: 'MODERATE' },
      { name: 'Breathing difficulty', duration: '1 day', severity: 'SEVERE' },
    ],
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    sampleTranscript: 'मला तीन दिवसांपासून ताप आणि खोकला आहे, आणि थोडे चालले तरी धाप लागते...',
    sampleTranslation: 'I have fever and cough for three days, and feeling breathless even on slight walking...',
    sampleSymptoms: [
      { name: 'Fever', duration: '3 days', severity: 'MODERATE' },
      { name: 'Cough', duration: '3 days', severity: 'MODERATE' },
      { name: 'Exertional breathlessness', duration: '2 days', severity: 'SEVERE' },
    ],
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    sampleTranscript: 'I have had high fever and persistent dry cough for three days, with progressive shortness of breath since morning...',
    sampleTranslation: 'I have had high fever and persistent dry cough for three days, with progressive shortness of breath since morning...',
    sampleSymptoms: [
      { name: 'Shortness of breath', duration: '1 day', severity: 'SEVERE' },
      { name: 'High fever', duration: '3 days', severity: 'MODERATE' },
      { name: 'Dry cough', duration: '3 days', severity: 'MODERATE' },
    ],
  },
];
