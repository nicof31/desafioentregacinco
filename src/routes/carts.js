
import productManager from "../dao/managers/productManager.js";
import cartsManager from "../dao/managers/cartsmanager.js";
const productList = new productManager("src/files/products.json");

import cartsManagerMongo from "../dao/managers/cartsManager.mongodb.js";
import cartsModel from "../dao/models/carts.model.js";
import productsModel from "../dao/models/products.model.js";

import { Router } from "express";

const routerCarts = Router();
const cartList = new cartsManager("src/files/carts.json");

const cartListMongo = new cartsManagerMongo("src/dao/managers/cartsManager.mongodb.js");


//---------------------GET---------------------
//http://localhost:8080/api/carts/
//http://localhost:8080/api/carts/?limit=2
routerCarts.get("/", async (req, res) => {
  const filterLimitCarts = await cartList.carts();
  if (req.query.limit) {
    const cartsFilter = filterLimitCarts.slice(0, req.query.limit);
    return res
      .status(200)
      .send({ status: "success", message: { cartsFilter } });
  } else {
    res.status(200).send({ status: "success", message: { filterLimitCarts } });
  }
});

  //MONGO
//http://localhost:8080/api/carts/mongo
//http://localhost:8080/api/carts/mongo/?limit=2
routerCarts.get("/mongo", async (req, res) => { 
  let cartsFilter = await cartsModel.find();
  try { 
      if (req.query.limit) {
      const cartsFilter = await cartsModel.find().limit(req.query.limit);
      return res.status(200).send({status:"success", message: { cartsFilter }});
    } else {
    return  res.status(200).send({result: "success mongoose", payload: cartsFilter});
    };  
  }
  catch(error){
    console.log("cannot get users with mongoose" + error)
    return res.status(404).send({status:"error",message: `No se puedo obtener productos en BBBD ${error}`});
  };
});

    //Busco por ID
  //  http://localhost:8080/api/carts/:pid
  routerCarts.get("/:pid", async (req, res) => {
    const idCarts = req.params.pid;
    const busquedaIdCarts = await cartList.cartById(idCarts);
    if (!busquedaIdCarts) {
      return res.status(404).send({status:"error",message: "El id de carrito buscado no existe, cargue un nuevo id"});
    }
    return res.status(200).send({status:"success, el id buscado es:",message:{ busquedaIdCarts }});
  });

    //MONGO
    // http://localhost:8080/api/carts/mongo/:pid
      routerCarts.get("/mongo/:pid", async (req, res) => {
        try{
        const idCarts = req.params.pid;
        const busquedaIdCarts = await cartListMongo.cartById(idCarts)
        if (busquedaIdCarts.length == 0) {
          console.log("estoy saliendo por aca IF")
          return res.status(404).send({status:"error",message: "El id de carrito buscado no existe, cargue un nuevo id"});
        }
        console.log("estoy saliendo por aca ELSE")
        return res.status(200).send({status:"success, el id buscado es:",message:{ busquedaIdCarts }});
      } catch (error) {
        console.log(`No se puede procesar la peticion GET '${error}'`);
        return res.status(404).send({status:"error",message: `No se puede procesar la peticion GET '${error}'`});
      };
      });

//---------------------POST ADD CARTS / INCREMENT QUANTITY---------------------
// http://localhost:8080/api/carts/crearcarts/:cid/products/:pid
routerCarts.post("/crearcarts/:cid/products/:pid", async (req, res) => {
  const idCart = req.params.cid;
  const idCartEn = Number(req.params.cid);
  const idProductsCart = req.params.pid;

  //busco id de carts si existe en carts.json
  const cartSearch = await cartList.carts();
  const searchIdCart = cartSearch.find(({ id }) => id == idCart);

  //busco id en products.json
  const findCartIdProduct = await productList.products();
  const idFindCartProduct = findCartIdProduct.find(
    ({ id }) => id == idProductsCart
  );
  if (!idFindCartProduct) {
    return res.status(404).send({
      status: "error",
      message:
        "El id producto buscado no existe en bbdd, cargue un nuevo id producto",
    });
  } else {
    if (idCartEn > 0) {
      if (!searchIdCart) {
        const product = idFindCartProduct.id;
        await cartList.addCarts(idCart, product);
        return res
          .status(200)
          .send({ status: "success, Carts created", message: {} });
      } else {
        let idProductAddCart = idFindCartProduct.id;
        await cartList.addCarts(idCart, idProductAddCart);
        return res.status(200).send({
          status:
            "success, el id carts existe en base y se puede agregar el producto",
          message: {},
        });
      }
    } else {
      return res.status(409).send({
        status: "error",
        message: "Ingrese un ID carts numerico mayor a 0",
      });
    }
  }
});


   //---MONGO--
 //Crear un nuevo producto
  //http://localhost:8080/api/carts/crearcarts/mongo/:cid/products/:pid
  routerCarts.post("/crearcarts/mongo/:cid/products/:pid", async (req, res) => {
    try {
      const idCart = req.params.cid;
      const idProductsCart = req.params.pid;
      //busco id de carts si existe en carts
      const cartSearch = await cartsModel.find();
      const searchIdCart = cartSearch.find(({ _id }) => _id == idCart);
      const findCartIdProduct = await productsModel.find();
      const idFindCartProduct = findCartIdProduct.find(({ _id }) => _id == idProductsCart);
        if(!idFindCartProduct){
          console.log(`id product id: ${idProductsCart} no existe`);
          return res.status(404).send({
            status: "error",
            message:
              "El id producto buscado no existe en bbdd, cargue un nuevo id producto",
          });
        } else {
          if (idCart > 0) {
                if(!searchIdCart) {
                  await cartListMongo.addCarts(idCart, idProductsCart);
                  return res.status(200).send({ status: "success, Carts created", message: {} });
                } else {
                  await cartListMongo.addCarts(idCart, idProductsCart);
                  return res.status(200).send({
                     status:
                       "success, el id carts existe en base y se puede agregar el producto",
                     message: {},
                   });
                } 
          }  else {
            return res.status(409).send({
              status: "error",
              message: "Ingrese un ID carts numerico mayor a 0",
            });
          };  
          }
    }
    catch(error){
    };
  });

//---------------------POST DISCONUNT QUANTITY CARTS---------------------
//http://localhost:8080/api/carts/deletequantitycarts/:cid/products/:pid
routerCarts.post(
  "/deletequantitycarts/:cid/products/:pid",
  async (req, res) => {
    const idCartQuan = req.params.cid;
    const idCartEnQuan = Number(req.params.cid);
    const idProductsCartQuan = req.params.pid;
    //busco id de carts si existe en carts.json
    const cartSearchQuan = await cartList.carts();
    const searchIdCartQuan = cartSearchQuan.find(({ id }) => id == idCartQuan);
    //busco si el producto existe en el carrito
    const quanProductCart = searchIdCartQuan.products;
    const quanFilteredProduct = quanProductCart.find(
      ({ product }) => product == idProductsCartQuan
    );
    if (!searchIdCartQuan) {
      return res.status(404).send({status:"error",message: "El id de carrito buscado no existe, cargue un nuevo id"});
    } else {
      if (!quanFilteredProduct) {
        return res.status(404).send({status:"error",message: "El id de carrito buscado no existe, cargue un nuevo id"});
      } else {
        const quanVerif = 1;
        const verifyQuanProduct = quanFilteredProduct;
        const quantitySearchProduct = verifyQuanProduct.quantity;
        let quanRta = Number(quantitySearchProduct);
        if (quanRta > quanVerif) {
          await cartList.discountQuantityPro(
            idCartEnQuan,
            idProductsCartQuan,
            quantitySearchProduct
          );
          return res.status(200).send({
            status:
              "success, el id producto en carts existe en base y se puede descontar cantidad",
            message: {},
          });
        } else {
          return res.status(409).send({
            status: "error",
            message:
              "La cantidad de producto en carrito es = 1, no se puede descontar mas cantidad",
          });
        };
      }
    }
  }
)

//MONGO
//http://localhost:8080/api/carts/mongo/deletequantitycarts/:cid/products/:pid

routerCarts.post("/mongo/deletequantitycarts/:cid/products/:pid", async (req, res) => {
  const idCartQuan = req.params.cid;
  const idProductsCartQuan = req.params.pid;
  //busco id de carts si existe en carts.json
  const cartSearchQuan = await cartsModel.find();
  const searchIdCartQuan = cartSearchQuan.find(({ _id }) => _id == idCartQuan);
  if (!searchIdCartQuan) {
    return res.status(404).send({status:"error",message: `El  carrito _id: ${idCartQuan} buscado no existe, cargue un nuevo id`});
  } else {
    //busco si el producto existe en el carrito
    const quanProductCart = searchIdCartQuan.products;
    const quanFilteredProduct = quanProductCart.find(({ product }) => product == idProductsCartQuan);
    if (!quanFilteredProduct) {
      return res.status(404).send({status:"error",message: `El producto _id:'${idProductsCartQuan}' buscado no existe, cargue un nuevo id`});
    } else { 
      const quanRta = quanFilteredProduct.quantity;
      const quanVerif = 1;
        if (quanRta > quanVerif) {
          await cartListMongo.discountQuantityPro(
            idCartQuan,
            idProductsCartQuan,
            quanRta
          );
          return res.status(200).send({
            status:
              "success, el id producto en carts existe en base y se puede descontar cantidad",
            message: {},
          });
        } else {
          return res.status(409).send({
            status: "error",
            message:
              "La cantidad de producto en carrito es = 1, no se puede descontar mas cantidad",
          });
        }; 
    }
  }
  });



export default routerCarts;
