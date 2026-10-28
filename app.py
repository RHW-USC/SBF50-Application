from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/choose-test")
def choose_test():
    return render_template("choose-test.html")

@app.route("/instructions")
def instruction():
    return render_template("instructions.html")

@app.route("/test")
def test():
    return render_template("test.html")

@app.route("/results")
def results():
    return render_template("results.html")

@app.route("/past-results")
def past_results():
    return render_template("past-results.html")

@app.route("/export")
def export():
    return render_template("export.html")

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)