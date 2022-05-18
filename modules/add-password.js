   //new scema forv pass cat
   const mongoose = require('mongoose');
   const mongoosePaginate = require('mongoose-paginate-v2');

   const passschema = new mongoose.Schema({
    password_category: {
        type: String,
        required: true,
       
    },
    username: {
        type: String,
        required: true,   
    },
    password_details: {
        type: String,
        required: true,
        
    }

});
passschema.plugin(mongoosePaginate);

// MODEL

const passdetailsmodel = mongoose.model('password_details', passschema);
module.exports=passdetailsmodel;
