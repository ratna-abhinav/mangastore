package com.example.shoppingdotcom.controller;

import com.example.shoppingdotcom.model.Category;
import com.example.shoppingdotcom.model.Product;
import com.example.shoppingdotcom.model.ProductOrder;
import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.service.*;
import com.example.shoppingdotcom.util.AppConstants;
import com.example.shoppingdotcom.util.CommonUtils;
import com.example.shoppingdotcom.util.OrderStatus;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.security.core.parameters.P;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserService userService;

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CommonUtils commonUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NeonStorageService neonStorageService;

    @ModelAttribute
    public void getUserDetails(Principal p, Model m) {
        if (p != null) {
            String email = p.getName();
            Users currentUser = userService.getUserByEmail(email);

            m.addAttribute("currentUser", currentUser);
            Integer countCart = cartService.getCountCart(currentUser.getId());
            m.addAttribute("countCart", countCart);
        }
        List<Category> activeCategories = categoryService.getAllActiveCategory();
        m.addAttribute("activeCategoriesSection", activeCategories);
    }


    @GetMapping("/")
    public String index() {
        return "admin/index";
    }

    @GetMapping("/loadAddProduct")
    public String loadAddProduct(Model m) {
        m.addAttribute("categories", categoryService.getAllCategory());
        return "admin/add_product";
    }

    @GetMapping("/category")
    public String category(Model m, @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
                           @RequestParam(name = "pageSize", defaultValue = "6") Integer pageSize) {

        Page<Category> page = categoryService.getAllCategoryPagination(pageNo, pageSize);
        List<Category> categories = page.getContent();
        m.addAttribute("categories", categories);

        m.addAttribute("pageNo", page.getNumber());
        m.addAttribute("pageSize", pageSize);
        m.addAttribute("totalElements", page.getTotalElements());
        m.addAttribute("totalPages", page.getTotalPages());
        m.addAttribute("isFirst", page.isFirst());
        m.addAttribute("isLast", page.isLast());

        return "admin/category";
    }

    @PostMapping("/saveCategory")
    public String saveCategory(@ModelAttribute Category category, @RequestParam("file") MultipartFile file, HttpSession session) throws IOException {

        Boolean existsCategory = categoryService.existsCategory(category.getName());
        if (existsCategory) {
            session.setAttribute("errorMsg", "Category name already exists");
        } else {
            String defaultImageUrl = AppConstants.DEFAULT_IMAGE_URL;
            category.setImageName(defaultImageUrl);

            Category updatedCategory = categoryService.saveCategory(category);
            if (ObjectUtils.isEmpty(updatedCategory)) {
                session.setAttribute("errorMsg", "Category not saved! Internal server error");
            } else {
                try {
                    String imageUploadUrl = neonStorageService.uploadFile("categories", file);
                    updatedCategory.setImageName(imageUploadUrl);
                    categoryService.saveCategory(updatedCategory);
                    session.setAttribute("succMsg", "Category saved successfully");
                } catch (IOException e) {
                    session.setAttribute("errorMsg", "Failed to save the category image: " + e.getMessage());
                }
            }
        }
        return "redirect:/admin/category";
    }

    @GetMapping("/deleteCategory/{id}")
    public String deleteCategory(@PathVariable int id, HttpSession session) {
        Category category = categoryService.getCategoryById(id);
        if (category == null) {
            session.setAttribute("errorMsg", "Category not found");
            return "redirect:/admin/category";
        }

        Boolean deleteCategory = categoryService.deleteCategory(id);
        if (deleteCategory) {
            session.setAttribute("succMsg", "Category deleted successfully !!");
        } else {
            session.setAttribute("errorMsg", "Category not deleted! Internal server error");
        }
        return "redirect:/admin/category";
    }

    @GetMapping("/loadEditCategory/{id}")
    public String loadEditCategory(@PathVariable int id, Model m) {
        m.addAttribute("category", categoryService.getCategoryById(id));
        return "admin/edit_category";
    }

    @PostMapping("/updateCategory/{id}")
    public String updateCategory(@PathVariable("id") int id, @ModelAttribute Category category, @RequestParam("file") MultipartFile file, HttpSession session) throws IOException {

        category.setId(id);
        Category prevCategory = categoryService.getCategoryById(category.getId());
        if (!ObjectUtils.isEmpty(category)) {
            prevCategory.setName(category.getName());
            prevCategory.setIsActive(category.getIsActive());
            if (category.getIsActive() == 0) {
                List<Product> products = productService.getProductsByCategory(category.getName());
                for (Product curProduct : products) {
                    curProduct.setIsActive(0);
                }
            }
            if (prevCategory.getImageName().isEmpty()) prevCategory.setImageName(AppConstants.DEFAULT_IMAGE_URL);
        }

        Category updatedCategory = categoryService.saveCategory(prevCategory);
        if (!ObjectUtils.isEmpty(updatedCategory)) {
            if (!file.isEmpty()) {
                try {
                    String imageUploadUrl = neonStorageService.uploadFile("categories", file);
                    updatedCategory.setImageName(imageUploadUrl);
                    categoryService.saveCategory(updatedCategory);
                    session.setAttribute("succMsg", "Category updated successfully !!");
                } catch (IOException e) {
                    session.setAttribute("errorMsg", "Failed to update the category image: " + e.getMessage());
                }
            }
        } else {
            session.setAttribute("errorMsg", "Category not updated! Internal server error");
        }
        return "redirect:/admin/loadEditCategory/" + category.getId();
    }

    @PostMapping("/saveProduct")
    public String saveProduct(@ModelAttribute Product product, @RequestParam("file") MultipartFile image, HttpSession session) throws IOException {

        product.setImage(AppConstants.DEFAULT_IMAGE_URL);
        product.setDiscount(0);
        product.setDiscountedPrice(product.getPrice());
        List<Category> activeCategories = categoryService.getAllActiveCategory();
        boolean isPresent = false;
        for (Category curCategory : activeCategories) {
            if (Objects.equals(curCategory.getName(), product.getCategory())) {
                isPresent = true;
                break;
            }
        }
        String successMsg = "Product saved successfully !!";
        if (!isPresent && product.getIsActive()==1) {
            product.setIsActive(0);
            successMsg = "Saved !! Status set to Inactive as category is inactive";
        }

        Product updatedProduct = productService.saveProduct(product);
        if (!ObjectUtils.isEmpty(updatedProduct)) {
            try {
                String imageUploadUrl = neonStorageService.uploadFile("products", image);
                updatedProduct.setImage(imageUploadUrl);
                productService.saveProduct(updatedProduct);
                session.setAttribute("succMsg", "Product added successfully !!");
            } catch (IOException e) {
                session.setAttribute("errorMsg", "Failed to save the product image: " + e.getMessage());
            }

        } else {
            session.setAttribute("errorMsg", "Product not saved! Internal Server error");
        }
        return "redirect:/admin/loadAddProduct";
    }

    @GetMapping("/products")
    public String loadViewProduct(Model m, @RequestParam(name = "keyword", defaultValue = "") String keyword,
                                  @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
                                  @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize) {

        Page<Product> page = null;
        if (StringUtils.hasText(keyword)) {
            page = productService.searchProductAdminPagination(pageNo, pageSize, keyword);
        } else {
            page = productService.getAllProductsPagination(pageNo, pageSize);
        }
        m.addAttribute("keyword", keyword);

        m.addAttribute("products", page.getContent());
        m.addAttribute("productsSize", page.getContent().size());

        m.addAttribute("pageNo", page.getNumber());
        m.addAttribute("pageSize", pageSize);
        m.addAttribute("totalElements", page.getTotalElements());
        m.addAttribute("totalPages", page.getTotalPages());
        m.addAttribute("isFirst", page.isFirst());
        m.addAttribute("isLast", page.isLast());
        return "admin/products";
    }

    @GetMapping("/deleteProduct/{id}")
    public String deleteProduct(@PathVariable int id, HttpSession session) {
        Boolean deleteProduct = productService.deleteProduct(id);
        if (deleteProduct) {
            session.setAttribute("succMsg", "Product successfully deleted");
        } else {
            session.setAttribute("errorMsg", "Product not deleted! Internal server error");
        }
        return "redirect:/admin/products";
    }

    @GetMapping("/editProduct/{id}")
    public String editProduct(@PathVariable int id, Model m) {
        m.addAttribute("product", productService.getProductById(id));
        m.addAttribute("categories", categoryService.getAllCategory());
        return "admin/edit_product";
    }

    @PostMapping("/updateProduct/{id}")
    public String updateProduct(@PathVariable("id") int id, @ModelAttribute Product product, @RequestParam("file") MultipartFile image, HttpSession session) {

        product.setId(id);
        if (product.getDiscount() < 0 || product.getDiscount() > 100) {
            session.setAttribute("errorMsg", "invalid Discount!");
        } else {
            List<Category> activeCategories = categoryService.getAllActiveCategory();
            boolean isPresent = false;
            for (Category curCategory : activeCategories) {
                if (Objects.equals(curCategory.getName(), product.getCategory())) {
                    isPresent = true;
                    break;
                }
            }

            String successMsg = "Product updated successfully !!";
            if (!isPresent && product.getIsActive()==1) {
                product.setIsActive(0);
                successMsg = "Updated !! Status set to Inactive as category is inactive";
            }

            Product updatedProduct = productService.updateProduct(product, image);
            if (!ObjectUtils.isEmpty(updatedProduct)) {
                session.setAttribute("succMsg", successMsg);
            } else {
                session.setAttribute("errorMsg", "Product not updated! Internal server error");
            }
        }
        return "redirect:/admin/editProduct/" + product.getId();
    }

    @GetMapping("/users")
    public String getAllUsers(Model m, @RequestParam Integer type) {

        List<Users> users = null;
        if (type == 1) {
            users = userService.getUsers("ROLE_USER");
        } else {
            users = userService.getUsers("ROLE_ADMIN");
        }
        m.addAttribute("userType", type);
        m.addAttribute("allUsers", users);
        return "admin/users";
    }

    @GetMapping("/updateStatus")
    public String updateUserAccountStatus(@RequestParam Boolean status, @RequestParam Integer id, @RequestParam Integer type, HttpSession session) {
        Boolean f = userService.updateAccountStatus(id, status);
        if (f) {
            session.setAttribute("succMsg", "Account Status Updated");
        } else {
            session.setAttribute("errorMsg", "Account status not updated! Internal Server Error");
        }
        return "redirect:/admin/users?type="+type;
    }

    @GetMapping("/orders")
    public String getAllOrders(Model m, @RequestParam(defaultValue = "") String orderId, HttpSession session,
                               @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
                               @RequestParam(name = "pageSize", defaultValue = "10") Integer pageSize) {

        if (StringUtils.hasText(orderId)) {
            ProductOrder curOrder = orderService.getOrdersByOrderId(orderId.trim());
            int cnt = 1;
            if (ObjectUtils.isEmpty(curOrder)) {
                session.setAttribute("errorMsg", "No such OrderID present !!");
                cnt = 0;
            }
            m.addAttribute("orders", curOrder);
            m.addAttribute("productsSize", 0);
            m.addAttribute("totalElements", cnt);
        } else {
            Page<ProductOrder> page = orderService.getAllOrdersPagination(pageNo, pageSize);
            m.addAttribute("orders", page.getContent());
            m.addAttribute("productsSize", page.getContent().size());
            m.addAttribute("pageNo", page.getNumber());
            m.addAttribute("pageSize", pageSize);
            m.addAttribute("totalElements", page.getTotalElements());
            m.addAttribute("totalPages", page.getTotalPages());
            m.addAttribute("isFirst", page.isFirst());
            m.addAttribute("isLast", page.isLast());
        }
        return "admin/orders";
    }

    @PostMapping("/update-order-status")
    public String updateOrderStatus(@RequestParam Integer id, @RequestParam Integer st, HttpSession session) {

        OrderStatus[] values = OrderStatus.values();
        String status = null;

        for (OrderStatus orderSt : values) {
            if (orderSt.getId().equals(st)) {
                status = orderSt.getName();
            }
        }

        ProductOrder updateOrder = orderService.updateOrderStatus(id, status);
        try {
            commonUtils.sendMailForProductOrder(updateOrder, status);
        } catch (Exception e) {
            e.printStackTrace();
        }
        if (!ObjectUtils.isEmpty(updateOrder)) {
            session.setAttribute("succMsg", "Order Status Updated !!");
        } else {
            session.setAttribute("errorMsg", "Status not updated. Internal Server Error !!");
        }
        return "redirect:/admin/orders";
    }

    @GetMapping("/add-admin")
    public String loadAdminAdd() {
        return "admin/add_admin";
    }

    @PostMapping("/save-admin")
    public String saveAdmin(@ModelAttribute Users user, @RequestParam("img") MultipartFile file, HttpSession session) throws IOException {

        user.setProfileImage(AppConstants.DEFAULT_IMAGE_URL);
        Users updatedAdmin = userService.saveAdmin(user);

        if (!ObjectUtils.isEmpty(updatedAdmin)) {
            if (!file.isEmpty()) {

                try {
                    String imageUploadUrl = neonStorageService.uploadFile("profiles", file);
                    updatedAdmin.setProfileImage(imageUploadUrl);
                    userService.saveAdmin(updatedAdmin);
                    session.setAttribute("succMsg", "Admin registered successfully !!");
                } catch (IOException e) {
                    session.setAttribute("errorMsg", "Failed to save the admin image: " + e.getMessage());
                }
            }
        } else {
            session.setAttribute("errorMsg", "Admin not registered !! Internal Server Error");
        }

        return "redirect:/admin/add-admin";
    }


    @GetMapping("/profile")
    public String profile() {
        return "admin/profile";
    }

    @PostMapping("/update-profile")
    public String updateProfile(@ModelAttribute Users user, @RequestParam MultipartFile img, HttpSession session) {

        Users updateUserProfile = userService.updateUserProfile(user, img);
        if (ObjectUtils.isEmpty(updateUserProfile)) {
            session.setAttribute("errorMsg", "Profile not updated");
        } else {
            session.setAttribute("succMsg", "Profile Updated");
        }
        return "redirect:/admin/profile";
    }

    @PostMapping("/change-password")
    public String changePassword(@RequestParam String newPassword, @RequestParam String currentPassword, Principal p, HttpSession session) {

        Users loggedInUserDetails = commonUtils.getLoggedInUserDetails(p);
        boolean matches = passwordEncoder.matches(currentPassword, loggedInUserDetails.getPassword());

        if (matches) {
            String encodePassword = passwordEncoder.encode(newPassword);
            loggedInUserDetails.setPassword(encodePassword);
            Users updatedUser = userService.updateUser(loggedInUserDetails);
            if (ObjectUtils.isEmpty(updatedUser)) {
                session.setAttribute("errorMsg", "Password not updated !! Error in server");
            } else {
                session.setAttribute("succMsg", "Password Updated sucessfully");
            }
        } else {
            session.setAttribute("errorMsg", "Current Password incorrect");
        }
        return "redirect:/admin/profile";
    }
}
