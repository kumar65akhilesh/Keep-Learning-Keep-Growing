
class Product {
  // title = 'DEFAULT';
  // imageUrl;
  // description;
  // price;

  constructor(title, image, desc, price) {
    this.title = title;
    this.imageUrl = image;
    this.description = desc;
    this.price = price;
  }
}

class ElementAttribute {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
}

class Component {
  constructor(renderHookId, renderItem = true) {
    this.hookId = renderHookId;
    if(renderItem) {
      this.render();
    }
  }
  render() {}
  createRootElement(tag, cssClass, attributes){
    const rootEl = document.createElement(tag);
    if(cssClass) {
      rootEl.className = cssClass;
    }
    if(attributes && attributes.length > 0) {
      for(const attr of attributes) {
        rootEl.setAttribute(attr.name, attr.value);
      }
    }
    document.getElementById(this.hookId).append(rootEl);
    return  rootEl;
  }
}

class ShoppingCart extends Component{
  items=[];
  
  constructor(hookId) {
    super(hookId, false);
    this.render();
  }
  addProduct(prod) {
    const updatedItems = [...this.items];
    updatedItems.push(prod);
    this.cartItems=updatedItems;
  }
  set cartItems(val) {
    //this.items.push(val);
    this.items = val;
    const h2Section = document.querySelector(".cart");
    
    h2Section.querySelector("h2").innerHTML = `Total: \$${this.getSum.toFixed(2)}`;
  }
  get getSum() {
    const sum = this.items.map(a=>a.price).reduce((sum, val)=> sum+val);    
    return sum;
  }
  render() {
    //const cartEl = document.createElement("section");
    const cartEl = this.createRootElement("section","cart");
    cartEl.innerHTML = `
      <h2>Total: \$${0}</h2>
      <button>Order Now</button>
      `;
      const orderBtn = cartEl.addEventListener("click", this.orderProducts);
      //return cartEl;
  }
  orderProducts = () => {
    console.log("Ordering..");
    console.log(this.items);
  }
}



class ProductItem extends Component{
  constructor(product, hookId) {
    super(hookId, false);
    this.product = product;
    this.render();
  }

  render() {
    const prodEl = this.createRootElement("li", "product-item");//document.createElement('li');
    //prodEl.className = 'product-item';
    prodEl.innerHTML = `
        <div>
          <img src="${this.product.imageUrl}" alt="${this.product.title}" >
          <div class="product-item__content">
            <h2>${this.product.title}</h2>
            <h3>\$${this.product.price}</h3>
            <p>${this.product.description}</p>
            <button>Add to Cart</button>
          </div>
        </div>
      `;
    const addCartBtn = prodEl.querySelector("button");
    addCartBtn.addEventListener("click", this.addCartHandler.bind(this));
    //return prodEl;
  }

  addCartHandler() {
   // const h2Section = document.querySelector(".cart");
    App.addProduct(this.product);
    const sum = App.getSum();
    console.log(sum);
   // h2Section.querySelector("h2").innerHTML = `Total: \$${sum}`;
    //console.log(this.product);
  }
}

class ProductList extends Component{
  #products = [
    new Product(
      'A Pillow',
      'https://www.maxpixel.net/static/photo/2x/Soft-Pillow-Green-Decoration-Deco-Snuggle-1241878.jpg',
      'A soft pillow!',
      19.99
    ),
    new Product(
      'A Carpet',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Ardabil_Carpet.jpg/397px-Ardabil_Carpet.jpg',
      'A carpet which you might like - or not.',
      89.99
    )
  ];

  constructor(renderHookId) {
    super(renderHookId, false);
    this.render();
  }

  render() {
    
    const attrs = [new ElementAttribute("id", "prd-list")];
    const prodList= this.createRootElement("ul","product-list", attrs);
    prodList.className = 'product-list';
    for (const prod of this.#products) {
      const productItem = new ProductItem(prod,"prd-list");
      //productItem.render();
      //prodList.append(prodEl);
    }
    return prodList;
    //renderHook.append(prodList);
  }
}

class Shop extends Component{
  //cart;
  constructor(renderHookId) {
    super(renderHookId);
  }
  render() {
    //const renderHook = document.getElementById('app');
    this.cart = new ShoppingCart("app");
    //this.cart.render();
    const productLst = new ProductList("app");
    //productLst.render();
  }

}



class App {
  static cart;
  static init() {
    const shop = new Shop("app");    
    //shop.render();
    this.cart = shop.cart;
  }

  static addProduct(prodItem) {
    this.cart.addProduct(prodItem);
  }

  static getSum() {
   
    return this.cart.getSum;
  }
}

App.init();


