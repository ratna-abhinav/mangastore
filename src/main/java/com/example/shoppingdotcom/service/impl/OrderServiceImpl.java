package com.example.shoppingdotcom.service.impl;

import com.example.shoppingdotcom.model.*;
import com.example.shoppingdotcom.repository.CartRepository;
import com.example.shoppingdotcom.repository.ProductOrderRepository;
import com.example.shoppingdotcom.service.OrderService;
import com.example.shoppingdotcom.util.CommonUtils;
import com.example.shoppingdotcom.util.OrderStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private ProductOrderRepository orderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CommonUtils commonUtils;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveOrder(Integer userid, OrderRequestDTO orderRequest) throws Exception {

        List<CartItem> carts = cartRepository.findByUserId(userid);
        if (carts.isEmpty()) {
            return;
        }

        List<String> uniqueOrderIds = generateUniqueOrderIds(carts.size());
        List<ProductOrder> orders = new ArrayList<>();

        for (int i = 0; i < carts.size(); i++) {
            CartItem cart = carts.get(i);
            ProductOrder order = new ProductOrder();
            order.setOrderId(uniqueOrderIds.get(i));
            order.setOrderDate(LocalDate.now());

            order.setProduct(cart.getProduct());
            order.setPrice(cart.getProduct().getDiscountedPrice() * cart.getQuantity());

            order.setQuantity(cart.getQuantity());
            order.setUser(cart.getUser());

            order.setStatus(OrderStatus.IN_PROGRESS.getName());
            order.setPaymentType(orderRequest.getPaymentType());

            OrderAddress address = getOrderAddress(orderRequest);
            order.setOrderAddress(address);
            orders.add(order);
        }

        List<ProductOrder> savedOrders = orderRepository.saveAll(orders);
        for (ProductOrder savedOrder : savedOrders) {
            commonUtils.sendMailForProductOrderAsync(savedOrder, "success");
        }
    }

    @Override
    public List<ProductOrder> getOrdersByUser(Integer userId) {
        return orderRepository.findByUserId(userId);
    }

    @Override
    public ProductOrder updateOrderStatus(Integer orderId, String status) {
        Optional<ProductOrder> curProductOrder = orderRepository.findById(orderId);
        if (curProductOrder.isPresent()) {
            ProductOrder updatedProductOrder = curProductOrder.get();
            if (Objects.equals(updatedProductOrder.getStatus(), status)) {
                return updatedProductOrder;
            }
            updatedProductOrder.setStatus(status);
            if (Objects.equals(status, OrderStatus.CANCELLED.getName())) {
                Product product = curProductOrder.get().getProduct();
                int curQuantity = curProductOrder.get().getQuantity();
                int oldStock = product.getStock();
                product.setStock(oldStock + curQuantity);
            }
            return orderRepository.save(updatedProductOrder);
        }
        return null;
    }

    @Override
    public List<ProductOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    private static OrderAddress getOrderAddress(OrderRequestDTO orderRequest) {
        OrderAddress address = new OrderAddress();
        address.setFirstName(orderRequest.getFirstName());
        address.setLastName(orderRequest.getLastName());
        address.setEmail(orderRequest.getEmail());
        address.setMobileNo(orderRequest.getMobileNo());
        address.setAddress(orderRequest.getAddress());
        address.setCity(orderRequest.getCity());
        address.setState(orderRequest.getState());
        address.setPincode(orderRequest.getPincode());
        return address;
    }

    private List<String> generateUniqueOrderIds(int count) {
        Set<String> ids = new HashSet<>(count * 2);
        while (ids.size() < count) {
            while (ids.size() < count) {
                ids.add(UUID.randomUUID().toString());
            }
            ids.removeAll(orderRepository.findExistingOrderIds(ids));
        }
        return new ArrayList<>(ids);
    }

    @Override
    public ProductOrder getOrdersByOrderId(String orderId) {
        return orderRepository.findByOrderId(orderId);
    }

    @Override
    public Page<ProductOrder> getAllOrdersPagination(Integer pageNo, Integer pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return orderRepository.findAll(pageable);

    }
}
