

import productManager from "../dao/managers/productManager.js"
import { Router } from "express";
import { io } from '../app.js';
import { Socket } from "socket.io";

const routerProdructs = Router();
const productList = new productManager("src/files/products.json");


  //ENDPOINTS
   //---------------------GET---------------------
  //http://localhost:8080/api/products
  //http://localhost:8080/api/products/?limit=2

   routerProdructs.get("/", async (req, res) => {
    const filterLimit = await productList.products();    
     if (req.query.limit) {
       const productsFilter = filterLimit.slice(0, req.query.limit);
    return res.status(200).send({status:"success", message: { productsFilter }});
     } else {
    return res.status(200).send({status:"success", message: {filterLimit}});
     };   
   });  
  //--------------------------------------------------------------------------------//

  //filtro de productos por id
  //http://localhost:8080/api/products/:pid
  routerProdructs.get("/:pid", async (req, res) => {
    const idProducts = req.params.pid;
    const busquedaIdProd = await productList.productById(idProducts);
    if (!busquedaIdProd) {
      return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
    }
    return res.status(200).send({status:"success, el id buscado es:",message:{ busquedaIdProd }});
  });
  
  //---------------------POST---------------------
  //Crear un nuevo producto
  //http://localhost:8080/api/products/crearproducto
  routerProdructs.post("/crearproducto", async (req, res) => {
    const crearProducto = req.body;
    if (!crearProducto.title || !crearProducto.description || !crearProducto.code || !crearProducto.price || !crearProducto.status || !crearProducto.category || !crearProducto.stock) {
      return res.status(400).send({status:"error",message:"Incomplete values"});
    } 
    const findCode = await productList.products();
    const codeVerf = findCode.find(({ code })=> code == crearProducto.code);
    if (codeVerf != null) {
      return res.status(409).send({status:"error",message: "El código de producto existe en otro producto, cargue un nuevo código de producto"});
    } else {
      await productList.addProduct(crearProducto.title, crearProducto.description, crearProducto.code, crearProducto.price, crearProducto.status, crearProducto.category, crearProducto.thumbnail,crearProducto.stock);     
      
      res.status(200).send({status:"success, Products created",message:{ crearProducto }});
      //envio datato al io para actualizar usaurios
      const updatedProducts = await productList.products();
      console.log("Se creo un nuevo producto en BBDD y se actualiza a todos los usuarios");
      io.emit('evento_para_todos', 'Se creo un nuevo producto en BBDD y se actualiza a todos los usuarios');
      return io.emit('product_added', updatedProducts);
    };
  });
  
  //---------------------PUT---------------------
  //update elementos
  routerProdructs.put("/actulizarproducto/:pid", async (req, res) => {
    const actualizarProducto = req.body;
    const idUpdate = req.params.pid;
    if (!actualizarProducto.title || !actualizarProducto.description || !actualizarProducto.code || !actualizarProducto.price || !actualizarProducto.status || !actualizarProducto.category || !actualizarProducto.stock) {
      return res.status(400).send({status:"error",message:"Incomplete values"});
    };
    const findCodeUpC = await productList.products();
    const idFindUpdate = findCodeUpC.find(({ id })=> id == idUpdate);
    const filterId = findCodeUpC.filter( id => id !== idFindUpdate);
    const newArrUpId = filterId;
    if(idFindUpdate == null){
      return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
    } else {
      const codDeProdBuscadoId = newArrUpId.find(({ code })=> code === actualizarProducto.code);
      if (codDeProdBuscadoId !=null){
      return res.status(409).send({status:"error",message: "El código de producto existe en otro producto, cargue un nuevo código de producto"});
      } else{
    let readThumbnail = JSON.stringify(idFindUpdate.thumbnail);
    let passThumbnail;
    if(actualizarProducto.thumbnail != null){
      passThumbnail = actualizarProducto.thumbnail;
    } else {
      passThumbnail = JSON.parse(readThumbnail) ; 
    };          
      await productList.updateProduct(idUpdate, actualizarProducto.title, actualizarProducto.description, actualizarProducto.code, actualizarProducto.price, actualizarProducto.status, actualizarProducto.category, passThumbnail ,actualizarProducto.stock);
      res.status(200).send({status:"success, Products actualizado en base",message:{ actualizarProducto }}); 
      const updatedProducts = await productList.products();
      console.log("Se actualizo parametros de producto en BBDD y se actualiza a todos los usuarios");
      io.emit('evento_para_todos', 'Actualización completa de parametros de producto en BBDD y se actualiza a todos los usuarios');
      return io.emit('product_updateComplet', updatedProducts);
    };
  };
});
    
    //---------------------PATCH---------------------
    //PACHT para actualizar valores en particular
    routerProdructs.patch("/actulizarparametro/:pid", async (req, res) => { 
      const updateParamPatch = req.body;
      const idUpdatePatch = req.params.pid;
      const findCodeUpdatePatch = await productList.products();
      const idVerfUpdatePatch = findCodeUpdatePatch.find(({ id })=> id == idUpdatePatch);
      const filterIdPacht = findCodeUpdatePatch.filter( id => id !== idVerfUpdatePatch);
      const newArrUpIdPacht = filterIdPacht;
      if (idVerfUpdatePatch != null) {
        const codDeProdPatchId = newArrUpIdPacht.find(({ code })=> code === req.body.code);
        if (codDeProdPatchId  !=null){
        return res.status(409).send({status:"error",message: "El código de producto existe en otro producto, cargue un nuevo código de producto"});
        } else {
        const newObjUpdate = Object.assign(idVerfUpdatePatch,updateParamPatch);
        await productList.updateParam(newObjUpdate);
        res.status(200).send({status:"success, el producto existe en base y se puede cambiar los parametros",message: { newObjUpdate }});
        const updatedProducts = await productList.products();
        console.log("Se actualizo parametros de producto en BBDD y se actualiza a todos los usuarios");
        io.emit('evento_para_todos', 'Actualización parcial parametros de producto en BBDD y se actualiza a todos los usuarios');
        return io.emit('product_updateParam', updatedProducts);
       }
      } else {
        return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
      };
    });
    
  //---------------------DELETE---------------------
  //DELETE  booro elemento
  routerProdructs.delete("/eliminarproducto/:pid", async (req, res) => {
    const idProdDelet = req.params.pid;
    const findCodeDelete = await productList.products();
    const idVerfDelete= findCodeDelete .find(({ id })=> id == idProdDelet);
    if (idVerfDelete == null) {
      return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
    }
    const busqIdProdDelet = await productList.deleteProduct(idProdDelet);
    res.status(200).send({status:"success, el producto eliminado es:", message:{ busqIdProdDelet }});
    //envio datato al io para actualizar usaurios
    const updatedProducts = await productList.products();
    console.log("Se elimino producto en BBDD y se actualiza a todos los usuarios");
    io.emit('evento_para_todos', 'Se elimino producto en BBDD y se actualiza a todos los usuarios');
    return io.emit('product_delete', updatedProducts);
  });

  export default routerProdructs;
