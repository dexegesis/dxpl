import dxpl from './dxpl';
import { setImmediate } from 'timers';
const signatureExpr =  /^([\w\/]+)(\([\w|,]+\))?$/;

export default class dContext {
    public result:any;
    
    constructor (public executor:dxpl) {
        this.result = {}
    }

    /**
     * @param root 
     * Resuelve todas las keys dentro de un arreglo de instrucciones
     * 
     */
    resolve(root) {
        var resolvers = Object.keys(root);

        return new Promise((resolve, reject) => {
            let currIdx = 0;
            var self = this;
            
            next();

            function next () {
                if(currIdx == resolvers.length) {
                    return resolve(self.getResultData())  
                }
                currIdx++;

                self.execute( root[resolvers[currIdx -1]] )
                    .then(partialResult => {
                        self.result[ resolvers[currIdx -1] ] = partialResult
                        next() 
                    })
                    .catch(error => {
                        let propName = resolvers[currIdx -1]
                        self.result[ propName ] = null
                        self.result[ propName + '__error' ] = error.message
                        reject(error)
                    })
            }
        })
    }


    getResultData() {
        let result = {}
        Object.keys(this.result).forEach(r => {
            if(r.charAt(0) != '$') result[r] = this.result[r]
        });
        return result
    }



    resolveFirst(verbExpr) {
    
        return new Promise((resolve, reject) => {
            if(typeof verbExpr == 'string') {
                //resolve as string
                let verb = this.executor.retrive(verbExpr);
                setImmediate(() =>  resolve(verb));
                return;
            } else if(typeof verbExpr == 'object') {
                if(verbExpr.constructor === [].constructor) {
                    this.execute(verbExpr).then(verb => resolve(verb))
                    return;
                }
            }

            reject(new Error('Cant resolve: ' + JSON.stringify(verbExpr) + ' as a verb'));
        });


    }

    execute(list) {
        let self        = this;

        return new Promise((resolve, reject) => {
            let params  = list.slice(1);
            let eParams = []
            let gVerb   = null;

            let endCall = () => {
                let result =  gVerb.apply(self, eParams);
                resolve(result);
            }

            let next = (eIdx) => {
                return () => {
                    console.log('eval:' + eIdx);
                    if(eIdx == params.length) return endCall();
                    let param = params[eIdx];



                    if(typeof param == 'object') {
                        if(param.constructor == [].constructor) {
                            self.execute(param)
                                .then(r => {
                                    eParams[eIdx] = r
                                    next(eIdx + 1)();
                                })
                                .catch(reject)
                        }
                    } else {
                        eParams[eIdx] = param;
                        next(eIdx +1 )();
                    }
                }
            } 


            self.resolveFirst(list[0]).then(verb => {
                if(typeof verb != 'function') {
                    throw new Error('Expression is not resolved as verb: ' + JSON.stringify(list[0]));
                }
                
                gVerb = verb;
                next(0)();

            }).catch( err =>  {
                reject(err)
            })

            

           

        });

    }


    /*
    execute(pragma) {
        return new Promise((resolve, reject) => {
            let currElement = 0;    
            let currVal     = null;
            let self        = this;

            function next () {
                if(currElement == pragma.length) {
                    return resolve(currVal);
                }

                let element = pragma[currElement]

                self.executeElement(element, currVal).then(result => {
                    currVal = result;
                    currElement++;
                    next();
                }).catch(err => {
                    console.log('rejecting...');
                    console.log(err);
                    reject(err);
                }) 
            }

            next();
        });
    }
    */ 

    /*
    
    executeElement(element, val) {
        return new Promise((resolve, reject) => {
            let caller:any = false;
            let isValue:any;
            let wasArr:any;

           if(typeof element == 'string') {
                var signature = element.match(signatureExpr);
                
                if(!signature) {
                    return reject(new Error(`Not a signature: "${element}"`))
                }

                //obtengo la función ejecutora
                caller = this.executor.retrive( signature[1] );

            
                if(!caller) {
                    return reject(new Error('Caller not defined: "' + element + '"'))
                }

                if(signature.length) {
                    caller = caller(signature,this)

                    if(typeof caller != 'function') {
                        isValue = caller
                        caller  = null
                    }
                }



            } else if(typeof element == 'object' && element.constructor == [].constructor) {
                wasArr = true
                caller = () => this.execute(element) 
            } else {
                isValue = element
            }

        

            if(isValue) {
                setImmediate(resolve.bind(null, isValue))
            } else if(caller) {
                let result = caller(val, this)

                if(result && typeof result.then == 'function') {
                    result.then(fResult => {
                        if(wasArr && typeof fResult == 'function') {
                            return fResult(val, this);
                        }
                        return fResult;
                    });
                }

                setImmediate( () =>  resolve(result))
            }

        });

    

    }
    */
}






