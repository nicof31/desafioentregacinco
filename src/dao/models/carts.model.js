import mongoose from "mongoose";

const cartsCollection = 'carts';

const cartItemSchema = new mongoose.Schema({
	product: { type: Number, required: true },
	quantity: { type: Number, required: true }
	//_id: false //no me creara el id dentro de products
  });
  
const cartsSchema = new mongoose.Schema({
	products: [cartItemSchema],
	_id: { type: Number, required: true }
  });


const cartsModel = mongoose.model(cartsCollection, cartsSchema);

export default cartsModel