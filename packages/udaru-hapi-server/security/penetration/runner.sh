#!/bin/bash
BASE_ENDPOINT="$1"
SWAGGER_ENDPOINT="$2"
BASELINE_REP_NAME="$3"
API_REP_NAME="$4"
REPORT_DEST_DIR="$5"

docker pull owasp/zap2docker-weekly
## run the baseline scan
if [[ $6 == '--baseline=true' ]]; then
    echo 'Running the baseline test'
    docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-weekly zap-baseline.py  -c udaruBaseline.config -t $BASE_ENDPOINT  -r $BASELINE_REP_NAME \
     -z "-config replacer.full_list\(0\).description=auth1 -config replacer.full_list\(0\).enabled=true -config replacer.full_list\(0\).matchtype=REQ_HEADER -config replacer.full_list\(0\).matchstr=Authorization -config replacer.full_list\(0\).regex=false -config replacer.full_list\(0\).replacement=ROOTid"

    if [ ! -f $BASELINE_REP_NAME ]; then
        echo 'Moving report file'
        mv  $BASELINE_REP_NAME $REPORT_DEST_DIR
    fi

fi

if [[ $7 == '--api=true' ]]; then
## run the api attack scan
    echo 'Running the API attach test'
    docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-weekly zap-api-scan.py -t $SWAGGER_ENDPOINT -f openapi -d -c udaruApi.config -r $API_REP_NAME \
     -z "-config replacer.full_list\(0\).description=auth1 -config replacer.full_list\(0\).enabled=true -config replacer.full_list\(0\).matchtype=REQ_HEADER -config replacer.full_list\(0\).matchstr=Authorization -config replacer.full_list\(0\).regex=false -config replacer.full_list\(0\).replacement=ROOTid"

    if [ ! -f $API_REP_NAME ]; then
        echo 'Moving report file'
        mv  $API_REP_NAME $REPORT_DEST_DIR
    fi

fi