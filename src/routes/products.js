import productManager from "../dao/managers/productManager.js";
import productManagerMongo from "../dao/managers/productManager.mongodb.js";
import productsModel from "../dao/models/products.model.js";
import { Router } from "express";
import { io } from "../app.js";

const routerProdructs = Router();
const productList = new productManager("src/files/products.json");
const productListMongo = new productManagerMongo("src/dao/managers/productManager.mongodb.js");
  


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

      //---MONGO--
        //http://localhost:8080/api/products/mongo
        //http://localhost:8080/api/products/mongo/?limit=2

      routerProdructs.get("/mongo", async (req, res) => { 
        let productsFilter = await productsModel.find();
        try { 
            if (req.query.limit) {
            const productsFilter = await productsModel.find().limit(req.query.limit);
            return res.status(200).send({status:"success", message: { productsFilter }});
          } else {
          return  res.status(200).send({result: "success mongoose", payload: productsFilter});
          };  
        }
        catch(error){
          console.log("cannot get users with mongoose" + error)
          return res.status(404).send({status:"error",message: `No se puedo obtener productos en BBBD ${error}`});
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
  
    //---MONGO--
  //http://localhost:8080/api/products/mongo/:pid
    routerProdructs.get("/mongo/:pid", async (req, res) => {
      try{
      const idProducts= req.params.pid;
      const busquedaIdProd = await productListMongo.productById(idProducts)
     
      console.log(busquedaIdProd )
      if (busquedaIdProd .length == 0) {
        console.log("estoy saliendo por aca IF")
        return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
      }
      console.log("estoy saliendo por aca ELSE")
      return res.status(200).send({status:"success, el id buscado es:",message:{ busquedaIdProd }});
    } catch (error) {
      console.log(`No se puede procesar la peticion GET '${error}'`);
      return res.status(404).send({status:"error",message: `No se puede procesar la peticion GET '${error}'`});
    };
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
      io.emit('product_added',updatedProducts)
     return  (updatedProducts);
    };
  });

    //---MONGO--
 //Crear un nuevo producto
  //http://localhost:8080/api/products/mongo/crearproducto
  routerProdructs.post("/mongo/crearproducto", async (req, res) => {
  try {
    const crearProducto = req.body;
    if (!crearProducto.title || !crearProducto.description || !crearProducto.code || !crearProducto.price || !crearProducto.status || !crearProducto.category || !crearProducto.stock) {
      return res.status(400).send({status:"error",message:"Incomplete values"});
    } 
    const findCode = await productsModel.find();
    const codeVerf = findCode.find(({ code })=> code == crearProducto.code);
    if (codeVerf != null) {
      return res.status(409).send({status:"error",message: `El código '${crearProducto.code}'de producto existe en otro producto, cargue un nuevo código de producto`});
    } else {
      await productListMongo.addProduct(crearProducto.title, crearProducto.description, crearProducto.code, crearProducto.price, crearProducto.status, crearProducto.category, crearProducto.thumbnail,crearProducto.stock);     
      res.status(200).send({status:"success, Products created",message:{ crearProducto }});
      
      /*
      //envio datato al io para actualizar usaurios
      const updatedProducts = await productsModel.find();
      console.log("Se creo un nuevo producto en BBDD y se actualiza a todos los usuarios");
      io.emit('evento_para_todos', 'Se creo un nuevo producto en BBDD y se actualiza a todos los usuarios');
      return io.emit('product_added', updatedProducts);
      */
    };
  } catch (error) {
    console.log(`No se puede procesar la peticion POST '${error}'`);
    return res.status(404).send({status:"error",message: `No se puede procesar la peticion POST '${error}'`});
  }
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

    //---MONGO--
 //Actualizar un nuevo producto
  //http://localhost:8080/api/products/mongo/actulizarproducto/:pid

  routerProdructs.put("/mongo/actulizarproducto/:pid", async (req, res) => {
    try{
    const actualizarProducto = req.body;
    const idUpdate = req.params.pid;
    if (!actualizarProducto.title || !actualizarProducto.description || !actualizarProducto.code || !actualizarProducto.price || !actualizarProducto.status || !actualizarProducto.category || !actualizarProducto.stock) {
      return res.status(400).send({status:"error",message:"Incomplete values"});
    };
    const findCodeUpC = await productsModel.find();
    const idFindUpdate = findCodeUpC.find(({ _id })=> _id == idUpdate);
    if(idFindUpdate == null){
      return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
    } else {
      const codDeProdBuscadoId = findCodeUpC.find(({ code })=> code === actualizarProducto.code);
      if (codDeProdBuscadoId !=null){
      return res.status(409).send({status:"error",message: "El código de producto existe en otro producto, cargue un nuevo código de producto"});
      } else{
        
    let passThumbnail;
    if(actualizarProducto.thumbnail != null){
      passThumbnail = actualizarProducto.thumbnail;
    } else {
      passThumbnail = idFindUpdate.thumbnail ;
    };          
      await productListMongo.updateProduct(idUpdate, actualizarProducto.title, actualizarProducto.description, actualizarProducto.code, actualizarProducto.price, actualizarProducto.status, actualizarProducto.category, passThumbnail ,actualizarProducto.stock);
      res.status(200).send({status:"success, Products actualizado en base",message:{ actualizarProducto }}); 
     /*
      const updatedProducts = await productsModel.find();
      console.log("Se actualizo parametros de producto en BBDD y se actualiza a todos los usuarios");
      io.emit('evento_para_todos', 'Actualización completa de parametros de producto en BBDD y se actualiza a todos los usuarios');
      return io.emit('product_updateComplet', updatedProducts);
      */
        };
      };
    } catch (error) {
      console.log(`No se puede procesar la peticion POST '${error}'`);
      return res.status(400).send({status:"error",message: `No se puede procesar la peticion POST '${error}'`});
    }
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
        
        /*
        const updatedProducts = await productList.products();
        console.log("Se actualizo parametros de producto en BBDD y se actualiza a todos los usuarios");
        io.emit('evento_para_todos', 'Actualización parcial parametros de producto en BBDD y se actualiza a todos los usuarios');
        return io.emit('product_updateParam', updatedProducts);

        */
       }
      } else {
        return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
      };
    });
    

 //---MONGO--
 //Actualizar un nuevo producto
  //http://localhost:8080/api/products/mongo/actulizarparametro/:pid
  routerProdructs.patch("/mongo/actulizarparametro/:pid", async (req, res) => { 
    try {
    const updateParamPatch = req.body;
    const idUpdatePatch = req.params.pid;
    const findCodeUpdatePatch = await productsModel.find();
    const idVerfUpdatePatch = findCodeUpdatePatch.find(({ _id })=> _id == idUpdatePatch);
    //console.log(idVerfUpdatePatch)

    if (idVerfUpdatePatch != null) { 
      console.log("el producto id existe y se puede modificar");
      const codDeProdPatchId = findCodeUpdatePatch.find(({ code })=> code == req.body.code);
      if (codDeProdPatchId  !=null){
      return res.status(409).send({status:"error",message: "El código de producto existe en otro producto, cargue un nuevo código de producto"});
      } else {

      const newObjUpdate = Object.assign(idVerfUpdatePatch,updateParamPatch);
      await productListMongo.updateParam(newObjUpdate);
      res.status(200).send({status:"success, el producto existe en base y se puede cambiar los parametros",message: { }});
      
      /*
      const updatedProducts = await productList.products();
      console.log("Se actualizo parametros de producto en BBDD y se actualiza a todos los usuarios");
      io.emit('evento_para_todos', 'Actualización parcial parametros de producto en BBDD y se actualiza a todos los usuarios');
      return io.emit('product_updateParam', updatedProducts);
      */
     }

    } else {
      console.log("el producto id NO existe y se va a agregar uno nuevo")
      return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
      }
    } catch (error) {
      console.log(`No se puede procesar la peticion POST '${error}'`);
      return res.status(404).send({status:"error",message: `No se puede procesar la peticion POST '${error}'`});
    }
  });


  //---------------------DELETE---------------------
  //DELETE  borro elemento
  routerProdructs.delete("/eliminarproducto/:pid", async (req, res) => {
    const idProdDelet = req.params.pid;
    const findCodeDelete =  await productsModel.find();
    const idVerfDelete= findCodeDelete.find(({ id })=> id == idProdDelet);
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

      //---MONGO--
 //delete
  //http://localhost:8080/api/products/mongo/eliminarproducto/:pid
  routerProdructs.delete("/mongo/eliminarproducto/:pid", async (req, res) => {
    try{
    const idProdDelet = req.params.pid;
    const findCodeDelete = await productsModel.find();
    const idVerfDelete= findCodeDelete .find(({ id })=> id == idProdDelet);
    if (idVerfDelete == null) {
      return res.status(404).send({status:"error",message: "El id de producto buscado no existe, cargue un nuevo id"});
    }
    const busqIdProdDelet = await productListMongo.deleteProduct(idProdDelet);
    res.status(200).send({status:"success, el producto eliminado es:", message:{ busqIdProdDelet }});
    /*
    //envio datato al io para actualizar usaurios
    const updatedProducts = await productsModel.find();
    console.log("Se elimino producto en BBDD y se actualiza a todos los usuarios");
    io.emit('evento_para_todos', 'Se elimino producto en BBDD y se actualiza a todos los usuarios');
    return io.emit('product_delete', updatedProducts);
*/
  } catch (error) {
    console.log(`No se puede procesar la peticion POST '${error}'`);
    return res.status(404).send({status:"error",message: `No se puede procesar la peticion POST '${error}'`});
  }
  });

  export default routerProdructs;
