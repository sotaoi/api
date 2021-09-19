#!/bin/bash

/usr/bin/pgrep mongo > /dev/null
if [ $? -ne 0 ]; then
  echo "inactive"
else
  echo "active"
fi
