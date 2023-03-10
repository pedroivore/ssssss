var expect = require('chai').expect;

describe('Collection Variables', function () {
    var testrun;

    before(function (done) {
        this.run({
            globals: {
                values: [
                    { key: 'global-var', value: 'global var value', name: 'global-var', enabled: true },
                    { key: 'user', value: 'incorrect username', name: 'user', enabled: true }
                ]
            },
            environment: {
                values: [
                    { key: 'env-var', value: 'env var value', name: 'env-var', enabled: true },
                    { key: 'pass', value: 'password', name: 'pass', enabled: true }
                ]
            },
            collection: {
                variable: [
                    { key: 'user', value: 'postman', enabled: true },
                    { key: 'pass', value: 'incorrect password', enabled: true },
                    { key: 'echo-url', value: 'https://postman-echo.com', enabled: true }
                ],
                item: {
                    name: 'Collection Variables Test Request',
                    event: [{
                        listen: 'test',
                        script: {
                            exec: ['console.log("test", pm.variables.toObject())']
                        }
                    }, {
                        listen: 'prerequest',
                        script: {
                            exec: ['console.log("test", pm.variables.toObject())']
                        }
                    }],
                    request: {
                        url: '{{echo-url}}/basic-auth',
                        method: 'GET',
                        auth: {
                            type: 'basic',
                            basic: [
                                { key: 'username', value: '{{user}}' },
                                { key: 'password', value: '{{pass}}' }
                            ]
                        }
                    }
                }
            }
        }, function (err, results) {
            testrun = results;
            done(err);
        });
    });

    it('should have run the test script successfully', function () {
        expect(testrun).to.be.ok;
        expect(testrun).to.nested.include({
            'test.calledOnce': true
        });
        expect(testrun.test.getCall(0).args[0]).to.be.null;
    });

    it('should have completed the run', function () {
        expect(testrun).to.be.ok;
        expect(testrun.done.getCall(0).args[0]).to.be.null;
        expect(testrun).to.nested.include({
            'done.calledOnce': true,
            'start.calledOnce': true
        });
    });

    it('should be resolved in request URL', function () {
        var url = testrun.request.getCall(0).args[3].url.toString();

        expect(url).to.equal('https://postman-echo.com/basic-auth');
    });

    it('should be resolved in request auth', function () {
        var request = testrun.response.getCall(0).args[3],
            response = testrun.response.getCall(0).args[2],
            auth = request.auth.parameters().toObject();

        expect(auth).to.deep.include({
            username: 'postman',
            password: 'password'
        });
        expect(response).to.have.property('code', 200);
    });

    it('should be resolved in test and prerequest scripts', function () {
        var testConsoleArgs = testrun.console.getCall(1).args.slice(2),
            prConsoleArgs = testrun.console.getCall(0).args.slice(2),
            variables = {
                'global-var': 'global var value',
                'env-var': 'env var value',
                'echo-url': 'https://postman-echo.com',
                user: 'postman',
                pass: 'password'
            };

        expect(prConsoleArgs).to.deep.include.members(['test', variables]);
        expect(testConsoleArgs).to.deep.include.members(['test', variables]);
    });
});
