from database import db
from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = 'users'

    id              = db.Column(db.Integer,     primary_key=True)
    username        = db.Column(db.String(80),  unique=True, nullable=False)
    email           = db.Column(db.String(120), unique=True, nullable=False)
    password_hash   = db.Column(db.String(255), nullable=False)
    full_name       = db.Column(db.String(120), nullable=False)
    age             = db.Column(db.Integer,     nullable=False)
    trimester       = db.Column(db.Integer,     nullable=False)   # 1, 2, or 3
    due_date        = db.Column(db.Date,        nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True, default=None)
    is_admin        = db.Column(db.Boolean,     default=False, nullable=False)
    created_at      = db.Column(db.DateTime,    default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime,    default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (to be used in later phases)
    vital_logs      = db.relationship('VitalLog',       backref='user', lazy=True, cascade='all, delete-orphan')
    journal_entries = db.relationship('JournalEntry',   backref='user', lazy=True, cascade='all, delete-orphan')
    medicines       = db.relationship('Medicine',       backref='user', lazy=True, cascade='all, delete-orphan')
    goals           = db.relationship('Goal',           backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id':              self.id,
            'username':        self.username,
            'email':           self.email,
            'full_name':       self.full_name,
            'age':             self.age,
            'trimester':       self.trimester,
            'due_date':        self.due_date.isoformat() if self.due_date else None,
            'profile_picture': self.profile_picture,
            'is_admin':        self.is_admin,
            'created_at':      self.created_at.isoformat(),
        }


class VitalLog(db.Model):
    __tablename__ = 'vital_logs'

    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    systolic_bp      = db.Column(db.Float,   nullable=False)
    diastolic_bp     = db.Column(db.Float,   nullable=False)
    blood_glucose    = db.Column(db.Float,   nullable=False)
    body_temp        = db.Column(db.Float,   nullable=False)
    heart_rate       = db.Column(db.Float,   nullable=False)
    risk_level       = db.Column(db.Integer, nullable=True)   # 0=Low 1=Mid 2=High
    confidence       = db.Column(db.Float,   nullable=True)
    prob_low         = db.Column(db.Float,   nullable=True)
    prob_mid         = db.Column(db.Float,   nullable=True)
    prob_high        = db.Column(db.Float,   nullable=True)
    logged_at        = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':           self.id,
            'systolic_bp':  self.systolic_bp,
            'diastolic_bp': self.diastolic_bp,
            'blood_glucose':self.blood_glucose,
            'body_temp':    self.body_temp,
            'heart_rate':   self.heart_rate,
            'risk_level':   self.risk_level,
            'confidence':   self.confidence,
            'prob_low':     self.prob_low,
            'prob_mid':     self.prob_mid,
            'prob_high':    self.prob_high,
            'logged_at':    self.logged_at.isoformat(),
        }


class JournalEntry(db.Model):
    __tablename__ = 'journal_entries'

    id           = db.Column(db.Integer,     primary_key=True)
    user_id      = db.Column(db.Integer,     db.ForeignKey('users.id'), nullable=False)
    date         = db.Column(db.Date,        nullable=False, default=date.today)
    mood         = db.Column(db.String(20),  nullable=False)   # Happy/Sad/Calm/Anxious/Tired
    text_content = db.Column(db.Text,        nullable=True)
    created_at   = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':           self.id,
            'date':         self.date.isoformat(),
            'mood':         self.mood,
            'text_content': self.text_content,
            'created_at':   self.created_at.isoformat(),
        }


class Medicine(db.Model):
    __tablename__ = 'medicines'

    id            = db.Column(db.Integer,     primary_key=True)
    user_id       = db.Column(db.Integer,     db.ForeignKey('users.id'), nullable=False)
    medicine_name = db.Column(db.String(120), nullable=False)
    time_to_take  = db.Column(db.String(10),  nullable=False)   # HH:MM
    frequency     = db.Column(db.String(20),  nullable=False)   # Daily / Weekly
    days_of_week  = db.Column(db.String(50),  nullable=True)    # "Mon,Wed,Fri"
    notes         = db.Column(db.String(255), nullable=True)
    is_active     = db.Column(db.Boolean,     default=True)
    created_at    = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':            self.id,
            'medicine_name': self.medicine_name,
            'time_to_take':  self.time_to_take,
            'frequency':     self.frequency,
            'days_of_week':  self.days_of_week,
            'notes':         self.notes,
            'is_active':     self.is_active,
            'created_at':    self.created_at.isoformat(),
        }


class Goal(db.Model):
    __tablename__ = 'goals'

    id               = db.Column(db.Integer,    primary_key=True)
    user_id          = db.Column(db.Integer,    db.ForeignKey('users.id'), nullable=False)
    title            = db.Column(db.String(120),nullable=False)
    category         = db.Column(db.String(50), nullable=False)  # Exercise/Nutrition/Mindfulness/etc.
    target_value     = db.Column(db.Integer,    nullable=False, default=100)
    current_progress = db.Column(db.Integer,    nullable=False, default=0)
    week_start       = db.Column(db.Date,       nullable=True)
    is_daily_reset   = db.Column(db.Boolean,    default=False)
    created_at       = db.Column(db.DateTime,   default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':               self.id,
            'title':            self.title,
            'category':         self.category,
            'target_value':     self.target_value,
            'current_progress': self.current_progress,
            'week_start':       self.week_start.isoformat() if self.week_start else None,
            'is_daily_reset':   self.is_daily_reset,
            'created_at':       self.created_at.isoformat(),
        }


class DailyChecklist(db.Model):
    __tablename__ = 'daily_checklists'

    id              = db.Column(db.Integer,  primary_key=True)
    user_id         = db.Column(db.Integer,  db.ForeignKey('users.id'), nullable=False)
    date            = db.Column(db.Date,     nullable=False, default=date.today)
    vitamins_taken  = db.Column(db.Boolean,  default=False)
    water_goal_met  = db.Column(db.Boolean,  default=False)
    stress_managed  = db.Column(db.Boolean,  default=False)
    exercise_done   = db.Column(db.Boolean,  default=False)
    sleep_hours     = db.Column(db.Float,    nullable=True)
    water_liters    = db.Column(db.Float,    nullable=True)

    def to_dict(self):
        return {
            'id':             self.id,
            'date':           self.date.isoformat(),
            'vitamins_taken': self.vitamins_taken,
            'water_goal_met': self.water_goal_met,
            'stress_managed': self.stress_managed,
            'exercise_done':  self.exercise_done,
            'sleep_hours':    self.sleep_hours,
            'water_liters':   self.water_liters,
        }
