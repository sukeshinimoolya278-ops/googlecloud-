import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("language") || "en";

  const explanations: Record<string, string> = {
    hi: "यह आपकी हालिया ब्लड शुगर रिपोर्ट है। आपका खाली पेट ब्लड शुगर 128 mg/dL और HbA1c 7.2% है। छह महीने पहले के 8.8% की तुलना में इसमें काफी सुधार हुआ है। अपनी मेटफॉर्मिन और टेल्मा की गोलियां समय पर लेते रहें।",
    kn: "ಇದು ನಿಮ್ಮ ಇತ್ತೀಚಿನ ರಕ್ತ ಪರೀಕ್ಷಾ ವರದಿಯಾಗಿದೆ. ನಿಮ್ಮ ಖಾಲಿ ಹೊಟ್ಟೆಯ ಸಕ್ಕರೆ ಮಟ್ಟ 128 mg/dL ಮತ್ತು HbA1c 7.2% ಇದೆ. 6 ತಿಂಗಳ ಹಿಂದೆ 8.8% ಇತ್ತು, ಈಗ ಗಮನಾರ್ಹ ಸುಧಾರಣೆ ಕಂಡುಬಂದಿದೆ. ನಿಮ್ಮ ಮೆಟ್‌ಫಾರ್ಮಿನ್ ಔಷಧಿಯನ್ನು ತಪ್ಪದೇ ತೆಗೆದುಕೊಳ್ಳಿ.",
    ta: "இது உங்கள் சமீபத்திய இரத்த பரிசோதனை அறிக்கை. உங்கள் ஃபாஸ்டிங் சர்க்கரை 128 mg/dL மற்றும் HbA1c 7.2% ஆக உள்ளது. 6 மாதங்களுக்கு முன்பு 8.8% இலிருந்து கணிசமாக முன்னேற்றம் அடைந்துள்ளது. உங்கள் மருந்துகளைத் தவறாமல் உட்கொள்ளுங்கள்.",
    en: "This is your recent blood test report. Your Fasting Blood Sugar is 128 mg/dL and HbA1c is 7.2%. This shows significant positive improvement compared to 8.8% six months ago. Please continue your prescribed Metformin and Telmisartan on time.",
  };

  return NextResponse.json({
    language: lang,
    content: explanations[lang] || explanations.en,
  });
}
