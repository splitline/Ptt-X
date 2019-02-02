class Eventer extends EventTarget {
    constructor() {
        super();
    }

    on(type, callback = () => undefined) {
        this.addEventListener(type, ({
            detail
        }) => {
            callback(detail);
        });
        return this;
    }
    
    once(type, callback = () => undefined) {
        this.addEventListener(type, ({
            detail
        }) => {
            callback(detail);
            this.removeEventListener(type, callback);
        });
        return this;
    }

    emit(type, data = "") {
        this.dispatchEvent(new CustomEvent(type, {
            detail: data
        }));
    }
}

export default Eventer;