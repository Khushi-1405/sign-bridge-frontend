import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import pickle

# 1. Load dataset
# Ensure you have deleted the old dataset.csv and recaptured data 
# with the new normalized sign_detection.py script!
try:
    data = pd.read_csv("dataset.csv", header=None)
    print(f"📊 Dataset loaded. Total samples: {len(data)}")
except FileNotFoundError:
    print("❌ dataset.csv not found. Run sign_detection.py first!")
    exit()

# 2. Features (X) & Labels (y)
X = data.iloc[:, :-1].values   # 42 coordinate values
y = data.iloc[:, -1].values    # The gesture names (hello, help, etc.)

# 3. Split data
# 'stratify=y' ensures the train/test sets have the same percentage of each sign
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 4. Train model
# n_estimators=100 is standard; we use Random Forest because it handles 
# landmark data very well and provides probability scores for confidence.
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. Detailed Evaluation
y_predict = model.predict(X_test)
accuracy = accuracy_score(y_test, y_predict)

print("\n✅ Overall Accuracy:", f"{accuracy * 100:.2f}%")
print("\n📝 Detailed Classification Report:")
# This report will show you which signs the model is struggling with
print(classification_report(y_test, y_predict))

# 6. Save model
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

print("💾 Model saved as model.pkl")