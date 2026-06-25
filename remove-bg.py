from PIL import Image

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    # Tolerance for what is considered "white"
    threshold = 230
    
    for item in datas:
        # item is (R, G, B, A)
        # If the pixel is mostly white, make it transparent
        # We can do a smooth blend for anti-aliasing
        r, g, b, a = item
        
        # Calculate how close the color is to pure white
        # If all components are high, it's white or grey.
        # But wait, the logo might have light colors we want to keep?
        # The logo is dark blue and green. 
        if r > threshold and g > threshold and b > threshold:
            # It's whiteish background
            # Calculate an alpha value to smooth the edge
            # Distance from threshold to 255
            # If 255, alpha = 0
            # If threshold, alpha = 255
            avg = (r + g + b) / 3
            if avg == 255:
                new_data.append((r, g, b, 0))
            else:
                ratio = (255 - avg) / (255 - threshold)
                new_alpha = int(255 * ratio)
                new_data.append((r, g, b, new_alpha))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    import sys
    remove_white_bg(
        "c:/xampp/htdocs/IP/ipirnet-app/public/assets/logo-ipirnet.bak.png",
        "c:/xampp/htdocs/IP/ipirnet-app/public/assets/logo-ipirnet.png"
    )
    print("White background removed successfully.")
