# init.py
from flask import Flask, request, send_from_directory, json
import config
from flask import make_response, request, current_app
from flask import jsonify, redirect, url_for
from flask import g, render_template, url_for, session
import boto3
import boto.ses
import base64
from urllib.request import urlopen

from datetime import timedelta
from functools import update_wrapper 
import pandas as pd 
import datetime
from flask_oidc import OpenIDConnect
from okta import UsersClient

from sklearn.linear_model import LinearRegression
from sklearn import model_selection
import pickle
import numpy as np
from json import dumps
from flask import Blueprint, render_template
from flask_login import login_required, current_user

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager 

# init SQLAlchemy so we can use it later in our models
db = SQLAlchemy()



def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = '9OLWxND4o83j4K4iuopO'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)


    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        # since the user_id is just the primary key of our user table, use it in the query for the user
        return User.query.get(int(user_id))

    # blueprint for auth routes in our app
    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    # blueprint for non-auth parts of app
    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app