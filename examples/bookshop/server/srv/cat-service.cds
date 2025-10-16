using { sap.capire.bookshop as my } from '../db/schema';
service CatalogService @(path:'/browse') {

  /** For displaying lists of Books */
  @readonly entity ListOfBooks as projection on Books
  excluding { descr };

  /** For display in details pages */
  @readonly entity Books as projection on my.Books { *,
    author.name as author
  } excluding { createdBy, modifiedBy };

  type StockPrice {
    stock  : Integer;
    price  : Decimal;
  }

  @requires: 'authenticated-user'
  action submitOrder ( book: Books:ID, quantity: Integer ) returns { stock: Integer };
  event OrderedBook : { book: Books:ID; quantity: Integer; buyer: String };

  function hello(to : String) returns String;
  function helloI18n() returns array of String;
  function getBestBook() returns Books;
  function getBestBooks() returns array of Books;
  function getONEStockPrice() returns StockPrice;
  function GET_STOCK_PRICES() returns array of StockPrice;

}
