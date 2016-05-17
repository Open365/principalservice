#!/bin/sh
echo "db.memberships.drop();db.principals.drop();db.workgroups.drop();" | mongo eyeos
