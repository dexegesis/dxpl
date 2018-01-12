import * as express from 'express'
import dxpl from './dxpl';
import dContext from './dContext';
import * as _ from 'underscore';
import * as Sequelize from 'sequelize'

const config = {
    "username": "root",
    "password": null,
    "database": "abits-crm-test",
    "logging": false,
    "host": "192.168.33.11",
    "dialect": "mysql"
}

const sequelize   = new Sequelize(config)
const app         = express();
const executor    = new dxpl;
const bodyParser  = require('body-parser');

/*
executor.register('$', function (data, context) {
    if(data && data.constructor == [].constructor) {
        data = data[0]
    }
    return context.result[data] || context.result[ '$'.concat(data) ]
});


function decomposeArray(expresor) {
    return function (data) {
        var result = {};

        expresor.forEach(element => {
            if(typeof data[element] == 'undefined') {
                throw new Error(`Prpoerty not found "${element}" while (${expresor.join(',')})`)
            }
            result[element] = data[element];
        });

        return result;
    }
}




executor.register('@', function(expresor) {
    if(expresor && expresor.constructor == [].constructor) {
        return decomposeArray(expresor);
    }

    return function(data, context)  {
        var result = {}

        Object.keys(expresor).forEach(key => { 
            result[key] = data[expresor[key]]
        });

        return result
    }


});

*/

executor.register('+', function(n1, n2) {

   return [].constructor.prototype.map.call(arguments, Number).reduce((r,c) => {
       return r +c
   }, 0)
});






executor.register('users/findAll', () => {
    return new Promise((resolve, reject)  => {
        sequelize.query("SELECT * FROM users").then(r => {
            console.log(r[0]);
            resolve(r[0])
        })
    })
});


executor.register('users/create', () => {
    return new Promise((resolve, reject) => {
        
    })
})






app.use(bodyParser.json());

app.post('/dxpl',(req, res) => {
    const context  = new dContext(executor);

    context.resolve(req.body)
        .then(result => res.send({data:result}))
        .catch(err => res.send({data:context.result}))
});



app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});