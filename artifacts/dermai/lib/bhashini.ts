/**
 * Bhashini API — Mock Implementation
 *
 * In production, replace these stubs with calls to the real Bhashini
 * Translation + TTS endpoints.
 *
 *   POST https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/compute
 *   Headers: { Authorization: BHASHINI_API_KEY, userID: BHASHINI_USER_ID }
 *
 * For now, every translation is keyed locally in the dictionary below so the
 * app is fully offline-first. Spoken output uses expo-speech with the
 * matching BCP-47 locale code (e.g. "hi-IN", "ta-IN").
 */

import * as Speech from "expo-speech";

export type LangCode = "en" | "hi" | "mr" | "ta" | "te" | "bn" | "gu";

export const LANGUAGES: { code: LangCode; label: string; native: string; locale: string }[] = [
  { code: "en", label: "English", native: "English", locale: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिंदी", locale: "hi-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", locale: "mr-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", locale: "ta-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", locale: "te-IN" },
  { code: "bn", label: "Bengali", native: "বাংলা", locale: "bn-IN" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", locale: "gu-IN" },
];

type Dict = Record<string, Record<LangCode, string>>;

export const STRINGS: Dict = {
  app_tagline: {
    en: "Skin Diagnosis · Offline Ready",
    hi: "त्वचा निदान · ऑफ़लाइन तैयार",
    mr: "त्वचा निदान · ऑफलाइन तयार",
    ta: "தோல் பரிசோதனை · ஆஃப்லைன் தயார்",
    te: "చర్మ పరీక్ష · ఆఫ్‌లైన్ సిద్ధం",
    bn: "ত্বক নির্ণয় · অফলাইন প্রস্তুত",
    gu: "ત્વચા નિદાન · ઑફલાઇન તૈયાર",
  },
  start_diagnosis: {
    en: "Start Diagnosis",
    hi: "निदान शुरू करें",
    mr: "निदान सुरू करा",
    ta: "பரிசோதனையை தொடங்கு",
    te: "పరీక్ష ప్రారంభించండి",
    bn: "নির্ণয় শুরু করুন",
    gu: "નિદાન શરૂ કરો",
  },
  select_language: {
    en: "Select Your Language",
    hi: "अपनी भाषा चुनें",
    mr: "तुमची भाषा निवडा",
    ta: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    te: "మీ భాషను ఎంచుకోండి",
    bn: "আপনার ভাষা নির্বাচন করুন",
    gu: "તમારી ભાષા પસંદ કરો",
  },
  patient_details: {
    en: "Patient Details",
    hi: "रोगी विवरण",
    mr: "रुग्ण तपशील",
    ta: "நோயாளி விவரம்",
    te: "రోగి వివరాలు",
    bn: "রোগীর বিবরণ",
    gu: "દર્દીની વિગતો",
  },
  patient_history: {
    en: "Patient History",
    hi: "रोगी का इतिहास",
    mr: "रुग्ण इतिहास",
    ta: "நோயாளியின் வரலாறு",
    te: "రోగి చరిత్ర",
    bn: "রোগীর ইতিহাস",
    gu: "દર્દીનો ઇતિહાસ",
  },
  full_name: { en: "Full Name", hi: "पूरा नाम", mr: "पूर्ण नाव", ta: "முழு பெயர்", te: "పూర్తి పేరు", bn: "পুরো নাম", gu: "પૂરું નામ" },
  age: { en: "Age", hi: "उम्र", mr: "वय", ta: "வயது", te: "వయస్సు", bn: "বয়স", gu: "ઉંમર" },
  sex: { en: "Sex", hi: "लिंग", mr: "लिंग", ta: "பால்", te: "లింగం", bn: "লিঙ্গ", gu: "જાતિ" },
  weight: { en: "Weight (kg)", hi: "वजन (किग्रा)", mr: "वजन (किलो)", ta: "எடை (கிலோ)", te: "బరువు (కిలో)", bn: "ওজন (কেজি)", gu: "વજન (કિગ્રા)" },
  village: { en: "Village Name", hi: "गाँव का नाम", mr: "गावाचे नाव", ta: "கிராமப் பெயர்", te: "గ్రామం పేరు", bn: "গ্রামের নাম", gu: "ગામનું નામ" },
  male: { en: "Male", hi: "पुरुष", mr: "पुरुष", ta: "ஆண்", te: "పురుషుడు", bn: "পুরুষ", gu: "પુરુષ" },
  female: { en: "Female", hi: "महिला", mr: "स्त्री", ta: "பெண்", te: "మహిళ", bn: "মহিলা", gu: "સ્ત્રી" },
  other: { en: "Other", hi: "अन्य", mr: "इतर", ta: "மற்றவை", te: "ఇతర", bn: "অন্যান্য", gu: "અન્ય" },
  yes: { en: "Yes", hi: "हाँ", mr: "होय", ta: "ஆம்", te: "అవును", bn: "হ্যাঁ", gu: "હા" },
  no: { en: "No", hi: "नहीं", mr: "नाही", ta: "இல்லை", te: "కాదు", bn: "না", gu: "ના" },
  describe: { en: "Describe", hi: "वर्णन करें", mr: "वर्णन करा", ta: "விவரி", te: "వివరించండి", bn: "বর্ণনা করুন", gu: "વર્ણન કરો" },
  next: { en: "Next", hi: "आगे", mr: "पुढे", ta: "அடுத்து", te: "తదుపరి", bn: "পরবর্তী", gu: "આગળ" },
  finish: { en: "Finish", hi: "समाप्त", mr: "समाप्त", ta: "முடி", te: "పూర్తి", bn: "শেষ", gu: "પૂર્ણ" },
  point_at_skin: {
    en: "Point at affected skin area",
    hi: "प्रभावित त्वचा क्षेत्र पर इंगित करें",
    mr: "बाधित त्वचेच्या भागावर निर्देश करा",
    ta: "பாதிக்கப்பட்ட தோல் பகுதியில் காட்டுங்கள்",
    te: "ప్రభావిత చర్మ ప్రాంతాన్ని చూపండి",
    bn: "আক্রান্ত ত্বক এলাকা চিহ্নিত করুন",
    gu: "અસરગ્રસ્ત ત્વચા વિસ્તાર પર નિર્દેશ કરો",
  },
  generate_referral: {
    en: "Generate Referral Slip",
    hi: "रेफरल पर्ची बनाएं",
    mr: "रेफरल स्लिप तयार करा",
    ta: "பரிந்துரை சீட்டை உருவாக்கு",
    te: "రిఫరల్ స్లిప్ సృష్టించండి",
    bn: "রেফারেল স্লিপ তৈরি করুন",
    gu: "રેફરલ સ્લિપ બનાવો",
  },
  submit_for_diagnosis: {
    en: "Submit for Diagnosis",
    hi: "निदान के लिए भेजें",
    mr: "निदानासाठी पाठवा",
    ta: "பரிசோதனைக்கு அனுப்பு",
    te: "పరీక్ష కోసం సమర్పించండి",
    bn: "নির্ণয়ের জন্য জমা দিন",
    gu: "નિદાન માટે મોકલો",
  },
  question_1: {
    en: "How long have you had this skin condition?",
    hi: "आपको यह त्वचा रोग कब से है?",
    mr: "तुम्हाला ही त्वचेची समस्या किती काळापासून आहे?",
    ta: "இந்த தோல் நோய் எவ்வளவு காலமாக உள்ளது?",
    te: "మీకు ఈ చర్మ సమస్య ఎంతకాలంగా ఉంది?",
    bn: "আপনার এই ত্বকের রোগ কতদিন ধরে?",
    gu: "તમને આ ત્વચા રોગ ક્યારથી છે?",
  },
  question_2: {
    en: "Is there itching, burning, or pain?",
    hi: "क्या खुजली, जलन या दर्द है?",
    mr: "खाज, जळजळ किंवा वेदना आहेत का?",
    ta: "அரிப்பு, எரிச்சல் அல்லது வலி உள்ளதா?",
    te: "దురద, మంట లేదా నొప్పి ఉందా?",
    bn: "কি চুলকানি, জ্বালা বা ব্যথা আছে?",
    gu: "ખંજવાળ, બળતરા કે દુખાવો છે?",
  },
  question_3: {
    en: "Has anyone in your household had a similar condition?",
    hi: "क्या आपके परिवार में किसी को ऐसी समस्या रही है?",
    mr: "तुमच्या कुटुंबातील कोणाला अशी समस्या होती का?",
    ta: "உங்கள் வீட்டில் யாருக்காவது இதே போன்ற நோய் இருந்ததா?",
    te: "మీ ఇంట్లో ఎవరికైనా ఇలాంటి సమస్య ఉందా?",
    bn: "আপনার পরিবারে কারো অনুরূপ সমস্যা ছিল?",
    gu: "તમારા ઘરમાં કોઈને આવી સમસ્યા હતી?",
  },
  question_4: {
    en: "Have you been treated for a skin disease before?",
    hi: "क्या पहले किसी त्वचा रोग का इलाज हुआ है?",
    mr: "पूर्वी कधी त्वचा रोगाचा उपचार झाला आहे का?",
    ta: "முன்பு தோல் நோய்க்கு சிகிச்சை பெற்றுள்ளீர்களா?",
    te: "మీరు ముందు చర్మ వ్యాధికి చికిత్స పొందారా?",
    bn: "আগে কখনো ত্বকের রোগের চিকিৎসা নিয়েছেন?",
    gu: "પહેલાં ક્યારેય ત્વચા રોગની સારવાર લીધી છે?",
  },
  question_5: {
    en: "Do you have diabetes, HIV, or any chronic illness?",
    hi: "क्या आपको मधुमेह, HIV या कोई पुरानी बीमारी है?",
    mr: "तुम्हाला मधुमेह, HIV किंवा कोणताही जुनाट आजार आहे का?",
    ta: "உங்களுக்கு நீரிழிவு, HIV அல்லது நாள்பட்ட நோய் உள்ளதா?",
    te: "మీకు మధుమేహం, HIV లేదా దీర్ఘకాలిక వ్యాధి ఉందా?",
    bn: "আপনার কি ডায়াবেটিস, HIV বা কোনো দীর্ঘস্থায়ী রোগ আছে?",
    gu: "તમને ડાયાબિટીસ, HIV કે કોઈ લાંબાગાળાનો રોગ છે?",
  },
  question_6: {
    en: "Are you currently taking any medication?",
    hi: "क्या आप वर्तमान में कोई दवा ले रहे हैं?",
    mr: "तुम्ही सध्या कोणतेही औषध घेत आहात का?",
    ta: "நீங்கள் தற்போது மருந்து எடுத்துக்கொள்கிறீர்களா?",
    te: "మీరు ప్రస్తుతం ఏదైనా మందు తీసుకుంటున్నారా?",
    bn: "আপনি কি বর্তমানে কোনো ওষুধ খাচ্ছেন?",
    gu: "તમે હાલમાં કોઈ દવા લો છો?",
  },
  question_7: {
    en: "Has the affected area changed in size or colour recently?",
    hi: "क्या प्रभावित क्षेत्र हाल ही में आकार या रंग में बदला है?",
    mr: "बाधित भागाचा आकार किंवा रंग अलीकडे बदलला आहे का?",
    ta: "பாதிக்கப்பட்ட பகுதி அளவு அல்லது நிறத்தில் சமீபத்தில் மாறியதா?",
    te: "ప్రభావిత ప్రాంతం పరిమాణం లేదా రంగులో మారిందా?",
    bn: "আক্রান্ত এলাকার আকার বা রঙ সম্প্রতি পরিবর্তিত হয়েছে?",
    gu: "અસરગ્રસ્ત વિસ્તાર તાજેતરમાં કદ કે રંગમાં બદલાયો છે?",
  },
};

/**
 * Mock Bhashini translation. In production:
 *   const res = await fetch(BHASHINI_TRANSLATE_URL, {
 *     method: "POST",
 *     headers: { "Authorization": API_KEY },
 *     body: JSON.stringify({ source: "en", target: lang, input: [{ source: text }] })
 *   });
 */
export function t(key: string, lang: LangCode): string {
  return STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key;
}

/**
 * Mock Bhashini TTS. Uses expo-speech with the appropriate locale code.
 * In production replace with the Bhashini TTS endpoint:
 *   POST /tts → returns audioContent (base64 wav) → play via expo-av
 */
export async function speak(text: string, lang: LangCode): Promise<void> {
  const locale = LANGUAGES.find((l) => l.code === lang)?.locale ?? "en-IN";
  try {
    Speech.stop();
    Speech.speak(text, { language: locale, pitch: 1.0, rate: 0.9 });
  } catch (e) {
    // expo-speech is unavailable in some web contexts — fail silently.
  }
}

export function speakKey(key: string, lang: LangCode): Promise<void> {
  return speak(t(key, lang), lang);
}
