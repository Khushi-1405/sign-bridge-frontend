import speech_recognition as sr
import cv2
import os
import numpy as np

recognizer = sr.Recognizer()

def get_audio():
    """Capture audio from microphone and convert to text."""
    with sr.Microphone() as source:
        print("🎤 Listening...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio = recognizer.listen(source, phrase_time_limit=7)

        try:
            text = recognizer.recognize_google(audio)
            print("You said:", text)
            return text.lower()
        except sr.UnknownValueError:
            print("❌ Could not understand")
            return ""
        except sr.RequestError:
            print("❌ API request failed")
            return ""

def load_gif_frames(word):
    """Load all frames of a GIF as a list of images."""
    path = f"signs/{word}.gif"
    if not os.path.exists(path):
        print(f"⚠️ No GIF found for: {word}")
        return []

    cap = cv2.VideoCapture(path)
    frames = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    cap.release()
    return frames

def play_sentence_gifs(sentence):
    """Play GIFs for all words in the sentence as one continuous video."""
    words = sentence.split()
    all_frames = []

    for word in words:
        frames = load_gif_frames(word)
        if frames:
            all_frames.extend(frames)
        else:
            # Optional: Add a placeholder frame for missing words
            placeholder = np.zeros((300, 300, 3), dtype=np.uint8)
            cv2.putText(placeholder, f"No sign: {word}", (10, 150),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            all_frames.append(placeholder)

    if not all_frames:
        print("🤷 No GIFs to play")
        return

    for frame in all_frames:
        cv2.imshow("Sign Output", frame)
        if cv2.waitKey(50) & 0xFF == 27:  # ESC to exit
            break

    cv2.destroyAllWindows()

def main():
    while True:
        text = get_audio()
        if not text:
            continue
        play_sentence_gifs(text)

if __name__ == "__main__":
    main()