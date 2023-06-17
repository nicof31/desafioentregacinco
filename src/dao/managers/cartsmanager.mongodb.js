import mongoose from "mongoose";
import cartsModel from "../models/carts.model.js";

export default class cartsManagerMongo {
  constructor(path) {
    this.path = path;
  }

  //--------------------GET CARTS---------------------
  carts = async () => {
    if (fs.existsSync(this.path)) {
      const dataCart = await fs.promises.readFile(this.path, "utf-8");
      const cartRta = JSON.parse(dataCart);
      return cartRta;
    } else {
      return [];
    };
  };

   //--------------------BUSQUEDA POR ID--------------------
  cartById  = async (idCarts) => {
    try{
      const resultBusqC = await cartsModel.find( {"_id": idCarts } );
      return resultBusqC;
  } catch(error){
      console.log(`No se puede porcesar la busqueda ${error}`);
      return error;
  };
  };

  //--------------------ADD CARTS---------------------

  addCarts = async (idCart, idProductAddCart) => {
    try {
    const resultBusqCartAdd  = await cartsModel.find( {"_id": idCart } );
    const idAutoGen = 1;

    if(resultBusqCartAdd.length == 0){
      const findmaxIdBase = await cartsModel.findOne({}, {}, { sort: { _id: -1 } });

      let idAutoGen;
      if (findmaxIdBase) {
        const maxId = findmaxIdBase._id;
        idAutoGen = maxId + 1;
      } else {
        idAutoGen = 1;
      }
    

      const productAdd = {
        product: idProductAddCart,
        quantity: 1,
      };

      await cartsModel.create({
        _id: idAutoGen,
        products: [productAdd]
      });

      console.log('Creación del producto exitosa');   
            }
            else {
              const cartId = idCart; 
              const productId = idProductAddCart; 
              
              cartsModel.findOne(
                { _id: cartId, "products.product": productId },
                { _id: 0, "products.$": 1 }
              )
                .then(result => {
                  if (result) {
                    const product = result.products[0];
                    console.log(`El objeto encontrado es: ${JSON.stringify(product)}`);
                    console.log(`La cantidad es: ${JSON.stringify(product.quantity)}`);
                      let findQuantity = JSON.stringify(product.quantity);
                    let numberNewQuantity = Number(findQuantity);
                    let newQuantity = numberNewQuantity + 1;
                                
                    const productUpdateAdd = {
                      product: Number(idProductAddCart),
                      quantity: newQuantity,
                    };
                            
                    cartsModel.updateOne(
                      { _id: idCart, "products.product": idProductAddCart },
                      { $set: { "products.$.quantity": newQuantity } }
                    )
                      .then(() => {
                        console.log("Se modificó products de carts con éxito");
                      })
                      .catch(error => {
                        console.error("Error al modificar products de carts:", error);
                      });

                    } else {
                      console.log(`No se encontró el objeto con el _id ${cartId} y product ${productId}`);
                      
                        const newProduct = {
                          product: idProductAddCart,
                          quantity: 1,
                        };
                        
                        cartsModel.updateOne(
                          { _id: idCart },
                          { $push: { products: newProduct } }
                        )
                          .then(() => {
                            console.log("Nuevo producto agregado al carrito con éxito");
                          })
                          .catch(error => {
                            console.error("Error al agregar el nuevo producto al carrito:", error);
                          });
                    };
                  })
                  .catch(error => {
                    console.error(error);
                  });
            }
          } catch (error) {
            console.log(`No se puede porcesar la busqueda ${error}`);
            return error;
        };
      };

    
  //--------------------DISCONUNT CANTINDAD-------------------
  discountQuantityPro = async (
    idCartQuan,
    idProductsCartQuan,
    quanRta
  ) =>  {
    try {

    let idQuanDes = idCartQuan;
    let idProducQuan = idProductsCartQuan;
    let quanSearch = Number(quanRta);

    console.log(quanSearch)
    const quanVerif = 1;
    if (quanSearch > quanVerif) {
      cartsModel.findOne(
        { _id: idQuanDes, "products.product": idProducQuan },
        { _id: 0, "products.$": 1 }
      )
        .then(result => {
          if (result) {
            const product = result.products[0];
            console.log(`El objeto encontrado es: ${JSON.stringify(product)}`);
            console.log(`La cantidad es: ${JSON.stringify(product.quantity)}`);
            let newQuantityDisc = product.quantity - 1;
            const productCartDisc = {
              product: idProductsCartQuan,
              quantity: newQuantityDisc,
            };
            console.log(productCartDisc);
            cartsModel.updateOne(
              { _id: idQuanDes, "products.product": idProducQuan },
              { $set: { "products.$.quantity": newQuantityDisc } }
            )
              .then(() => {
                console.log("Se modificó la cantidad de products de carts con éxito");
              })
              .catch(error => {
                console.error("Error al modificar cantidad products de carts:", error);
              });
          }
        })
    } else {
      console.log("La cantidad de producto en carrito es = 1, no se puede descontar mas cantidad");
    }
  } catch (error) {
    console.log(`No se puede porcesar la busqueda ${error}`);
    return error;
};
};
}
