from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database import db
from auth import auth_bp
from predict import predict_bp
from journal import journal_bp
from vitals import vitals_bp
from chat import chat_bp
from medicines import medicines_bp
from goals import goals_bp
import os


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY']                     = os.environ.get('SECRET_KEY',     'babybloom-dev-secret')
    app.config['JWT_SECRET_KEY']                 = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES']       = False
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    MYSQL_USER     = os.environ.get('MYSQL_USER',     'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'password')
    MYSQL_HOST     = os.environ.get('MYSQL_HOST',     'localhost')
    MYSQL_PORT     = os.environ.get('MYSQL_PORT',     '3306')
    MYSQL_DB       = os.environ.get('MYSQL_DB',       'babybloom')

    app.config['SQLALCHEMY_DATABASE_URI'] = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
        f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    )

    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)
    JWTManager(app)
    CORS(app, origins=['http://localhost:3000'], supports_credentials=True)

    app.register_blueprint(auth_bp,      url_prefix='/auth')
    app.register_blueprint(predict_bp,   url_prefix='/api')
    app.register_blueprint(journal_bp,   url_prefix='/journal')
    app.register_blueprint(vitals_bp,    url_prefix='/vitals')
    app.register_blueprint(chat_bp,      url_prefix='/chat')
    app.register_blueprint(medicines_bp, url_prefix='/medicines')
    app.register_blueprint(goals_bp,     url_prefix='/goals')

    with app.app_context():
        db.create_all()
        print('✓ All tables ready')

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)