#!/bin/bash

for i in $(seq 1 100); do
	mocha -u tdd component-test --timeout 60000
done