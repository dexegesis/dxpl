import dxpl from './dxpl';

export default class dContext {
    public result:any;

    constructor (public executor:dxpl) {
        this.result = {}
    }


    resolve(root) {
        var resolvers = Object.keys(root);

        return new Promise((resolve, reject) => {
            let currIdx = 0;
            var self = this;
            next();

            function next () {
                if(currIdx == resolvers.length) {
                    let result = {}
                    Object.keys(self.result).forEach(r => {
                        if(r.charAt(0) != '$') result[r] = self.result[r]
                    });
                    return resolve(result)        
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


   

    execute(pragma) {
        return new Promise((resolve, reject) => {
            let currElement = 0;    
            let currVal     = null;
            let self        = this;

            function next () {
                if(currElement == pragma.length) {
                    return resolve(currVal);
                }

                let element = pragma[currElement];

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


    executeElement(element, val) {
        return new Promise((resolve, reject) => {
            let caller:any = false;
            let isValue:any;
            let wasArr:any;

           if(typeof element == 'string') {
                var signature = element.split(':');
                caller = this.executor.retrive( signature.shift() );

                if(!caller) {
                    reject(new Error('Caller not defined: "' + element + '"'))
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
                    
                    return result.then(fResult => {
                        if(wasArr && typeof fResult == 'function') {
                            let finalResult = fResult(val, this);
                            if(finalResult && typeof finalResult.then == 'function') {
                                finalResult.then( r  => resolve(r) );
                            } else {
                                resolve(finalResult);
                            }
                            return;
                        }
                        resolve(fResult)
                    })


                } else {
                    setImmediate( () =>  resolve(result))
                }  
            }
        });

    }
}



