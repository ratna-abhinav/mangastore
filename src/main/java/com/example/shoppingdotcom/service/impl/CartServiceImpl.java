package com.example.shoppingdotcom.service.impl;

import com.example.shoppingdotcom.model.CartItem;
import com.example.shoppingdotcom.model.Product;
import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.repository.CartRepository;
import com.example.shoppingdotcom.repository.ProductRepository;
import com.example.shoppingdotcom.repository.UserRepository;
import com.example.shoppingdotcom.service.CartService;
import com.example.shoppingdotcom.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @Override
    public CartItem saveCart(Integer productId, Integer userId) {
        Users user = userRepository.findById(userId).get();
        Product product = productRepository.findById(productId).get();
        CartItem cartStatus = getCurrentQuantity(productId, userId);
        CartItem cartItem = null;

        if (ObjectUtils.isEmpty(cartStatus)) {
            cartItem = new CartItem();
            cartItem.setProduct(product);
            cartItem.setUser(user);
            cartItem.setQuantity(1);
            cartItem.setTotalPrice(1 * product.getDiscountedPrice());
        } else {
            cartItem = cartStatus;
            cartItem.setQuantity(cartItem.getQuantity() + 1);
            cartItem.setTotalPrice(cartItem.getQuantity() * cartItem.getProduct().getDiscountedPrice());
        }
        return cartRepository.save(cartItem);
    }

    @Override
    public List<CartItem> getCartsByUser(Integer userId) {
        List<CartItem> cartContents = cartRepository.findByUserId(userId);
        Double totalOrderPrice = 0.0;
        List<CartItem> updatedCart = new ArrayList<>();

        for (CartItem c : cartContents) {
            Double totalPrice = (c.getProduct().getDiscountedPrice() * c.getQuantity());
            c.setTotalPrice(totalPrice);
            totalOrderPrice = totalOrderPrice + totalPrice;
            c.setTotalOrderPrice(totalOrderPrice);
            updatedCart.add(c);
        }
        return updatedCart;
    }

    @Override
    public void resetCart(Integer userId) {
        List<CartItem> cartContents = cartRepository.findByUserId(userId);
        if (!cartContents.isEmpty()) {
            for (CartItem c : cartContents) {
                Product curProduct = productService.getProductById(c.getProduct().getId());
                int newStock = curProduct.getStock() - c.getQuantity();
                curProduct.setStock(newStock);
                cartRepository.delete(c);
            }
        }
    }

    @Override
    public Integer getCountCart(Integer userId) {
        return cartRepository.countByUserId(userId);
    }

    @Override
    public Boolean updateQuantity(String sy, Integer cid) {
        CartItem cartItem = cartRepository.findById(cid).get();
        int updatedQuantity;

        if (sy.equalsIgnoreCase("de")) {
            updatedQuantity = cartItem.getQuantity() - 1;
            if (updatedQuantity == 0) {
                cartRepository.delete(cartItem);
            } else {
                cartItem.setQuantity(updatedQuantity);
                cartRepository.save(cartItem);
            }
        } else {
            Product product = productService.getProductById(cartItem.getProduct().getId());
            if (cartItem.getQuantity() == product.getStock()) {
                return false;
            }
            updatedQuantity = cartItem.getQuantity() + 1;
            cartItem.setQuantity(updatedQuantity);
            cartRepository.save(cartItem);
        }
        return true;
    }

    @Override
    public CartItem getCurrentQuantity(Integer productId, Integer userId) {
        return cartRepository.findByProductIdAndUserId(productId, userId);
    }

    @Override
    public void removeFromCart(Integer cartItemId) {
        cartRepository.findById(cartItemId).ifPresent(cartRepository::delete);
    }
}
