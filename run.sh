#!/bin/bash


export $(cat .env)
npx nodemon start
