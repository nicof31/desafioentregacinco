
import productManager from "../dao/managers/productManager.js";
const productList = new productManager("src/files/products.json");

import { Router } from "express";
import { io } from '../app.js';

const routerView = Router();


//----------------------REALTIME Handlebars---------------------------------//
// Ruta GET para mostrar el listado de productos en tiempo real
routerView.get("/realtimeproducts", async (req, res) => {
  const filterLimit = await productList.products();
  if (req.query.limit) {
    const productsRealTime = filterLimit.slice(0, req.query.limit);
    return res.render('realtimeproducts', { productsRealTime });
  } else {
    const productsRealTime = filterLimit.slice(0, req.query.limit);
    return res.render('realtimeproducts', { productsRealTime });
  };
});

 //-----------------------HOME Handlebars---------------------------------//
 routerView.get("/products", async (req, res) => {
  const filterLimit = await productList.products();    
   if (req.query.limit) {
     const productsFilter = filterLimit.slice(0, req.query.limit);
     return res.render('home',{
      productsFilter});
   } else {
    const productsFilter =  filterLimit;
    return res.render('home',{
    productsFilter});
   };   
 });

   //-----------------------CHAT Handlebars---------------------------------//
   routerView.get("/chat", async (req, res) => {
    const chat = "prueba chat web soket"
       return res.render('chat',{
        chat});
   });
  

export default routerView;

