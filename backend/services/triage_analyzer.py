import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(".env", override=True)
load_dotenv(".env.local", override=True)

API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

async def generate_triage_questions(symptoms: str):
    if not API_KEY:
        return {"questions": ["Are you experiencing severe pain?", "Do you have a fever?", "Is there any noticeable swelling?"]}

    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    You are an expert AI Triage Nurse.
    The patient reports the following initial symptom(s): "{symptoms}"
    
    To better understand their condition before giving a final medical diagnosis, generate 3 to 5 common associated symptoms or follow-up questions.
    Keep the questions extremely concise and patient-friendly (e.g. "Do you have a cough?", "Are you experiencing body pain?", "Do you feel nauseous?").
    
    Return your response STRICTLY as a JSON array of strings containing the questions. Do not include markdown formatting or extra text.
    Example output format:
    ["Question 1?", "Question 2?", "Question 3?"]
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2, 
            )
        )
        
        result_text = response.text.strip()
        
        if result_text.startswith("```json"):
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif result_text.startswith("```"):
            result_text = result_text.split("```")[1].split("```")[0].strip()
            
        questions_array = json.loads(result_text)
        
        if not isinstance(questions_array, list):
            raise ValueError("Gemini did not return a JSON array.")
            
        return {"questions": questions_array[:5]} # hard cap to 5 questions
        
    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error in triage: {e}\nRaw output: {result_text}")
        return {"questions": ["Could you describe any other symptoms?", "How long have you felt this way?", "Is the pain or discomfort severe?"]}
    except Exception as e:
        import traceback
        print("Error in triage generation:")
        traceback.print_exc()
        return {"questions": ["Do you have any other symptoms?", "Have you had a fever recently?", "Are you experiencing any pain?"]}
