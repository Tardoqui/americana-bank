const { Schema, model, default: mongoose } = require("mongoose");

const transferSchema = new Schema ({
    destinyAccount: { type: String, required: true, unique: true },
    amountOfMoney: { type: String, required: true, unique: true }

    

})

const TransferModel = model("Transfer", transferSchema);

module.exports = TransferModel;