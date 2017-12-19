

export default class DXPL {
    protected hashmap:any;
    
    constructor() {
        this.hashmap = {}
    }

    register(name, fn):DXPL {
        //Register this
        this.hashmap[name] = fn;
        return this;
    }
    
    retrive(name) {
        return this.hashmap[name]
    }
}