const cds = require('@sap/cds')

class CatalogService extends cds.ApplicationService { init(){

  const { Books } = cds.entities ('sap.capire.bookshop')
  const { ListOfBooks } = this.entities

  this.on("hello", (req) => {
    console.log("hello: " + JSON.stringify(req.data));
    return "Hello " + req.data.to;
  });

  this.on("helloI18n", () => {
    return ["Hello", "Hallo", "Holla", "Olé olé!"];
  });

  this.on("getBestBook", async () => {
    const book = await cds.run(
        SELECT.one.from(Books).where("ID", "=", 201)
    );
    return book;
  })

  this.on("getBestBooks", async () => {
    const books = await cds.run(
        SELECT.from(Books).limit(5)
    );
    return books;
  })

  // Reduce stock of ordered books if available stock suffices
  this.on ('submitOrder', async req => {
    const {book,quantity} = req.data
    if (quantity < 1) return req.reject (400,`quantity has to be 1 or more`)
    let b = await SELECT `stock` .from (Books,book)
    if (!b) return req.error (404,`Book #${book} doesn't exist`)
    let {stock} = b
    if (quantity > stock) return req.reject (409,`${quantity} exceeds stock for book #${book}`)
    await UPDATE (Books,book) .with ({ stock: stock -= quantity })
    await this.emit ('OrderedBook', { book, quantity, buyer:req.user.id })
    return { stock }
  })

  // Add some discount for overstocked books
  this.after ('READ', ListOfBooks, each => {
    if (each.stock > 111) each.title += ` -- 11% discount!`
  })

  return super.init()
}}

module.exports = { CatalogService }
