#!/bin/bash

RANDOMINPUT=()
for i in `seq 0 4`
do
	RANDOMINPUT[$i]=$(cat /dev/urandom | LC_ALL=C tr -dc '[:alpha:]' | fold -w 20 | head -n 1)
done

cp .env.template .env

if [ $(uname) = 'Darwin' ]
then
	EXTENSION=".backup"
fi

sed -i $EXTENSION "s/\(POSTGRES_USER=\).*/\1${RANDOMINPUT[0]}/" .env
sed -i $EXTENSION "s/\(POSTGRES_PASSWORD=\).*/\1${RANDOMINPUT[1]}/" .env
sed -i $EXTENSION "s/\(COOKIE_KEY=\).*/\1${RANDOMINPUT[2]}/" .env
sed -i $EXTENSION "s/\(RANDOM_NUMBER1=\).*/\1${RANDOMINPUT[3]}/" .env
sed -i $EXTENSION "s/\(RANDOM_NUMBER2=\).*/\1${RANDOMINPUT[4]}/" .env

rm -rf .env.backup
