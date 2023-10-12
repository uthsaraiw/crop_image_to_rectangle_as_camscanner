import cv2
import math
import numpy as np

window_name = "Wrap"
minArea = 1000
scale = 2
w = 210 * scale
h = 297 * scale
pad = 20
imgName = 27
# read the image
image = cv2.imread(f'a4_imgs/{imgName}.jpg')

#todo 2. change this scalling factor according to the new one

# Define the new dimensions (width, height) or the scaling factor
new_height = 750
new_width = 400

# Resize the image using the specified dimensions
image = cv2.resize(image, (new_width, new_height))
cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)

# edge detecting
img_gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
img_blur = cv2.GaussianBlur(img_gray,(5, 5), 1)
ret, thresh = cv2.threshold(img_gray, 130, 255, cv2.THRESH_BINARY)

# contours filtering
contours, hierarchy = cv2.findContours(image=thresh, mode=cv2.RETR_EXTERNAL, method=cv2.CHAIN_APPROX_NONE)

finalCounters = []
for i in contours:
    area = cv2.contourArea(i)
    if area > minArea:
        peri = cv2.arcLength(i, True)
        approx = cv2.approxPolyDP(i, 0.02*peri, True)
        bbox = cv2.boundingRect(approx)
        finalCounters.append([len(approx), area, approx, bbox, i])
finalCounters = sorted(finalCounters, key= lambda x:x[1], reverse = True)
biggest_points = finalCounters[0][2][:4]

# movable pointer creation
dragging = False
one = False
two = False
three = False
four = False
start_x, start_y = 0, 0
center_coordinates = tuple(biggest_points[0][0])
center_coordinates2 = tuple(biggest_points[1][0])
center_coordinates3 = tuple(biggest_points[2][0])
center_coordinates4 = tuple(biggest_points[3][0])
radius = 5
def on_mouse(event, x, y, flags, param):
    global dragging, start_x, start_y, center_coordinates, center_coordinates2, center_coordinates3, center_coordinates4, one, two, three, four

    if event == cv2.EVENT_LBUTTONDOWN:
        if math.sqrt((x - center_coordinates[0])**2 + (y - center_coordinates[1])**2) <= radius:
            dragging = True
            start_x, start_y = x, y
            one = True
        if math.sqrt((x - center_coordinates2[0])**2 + (y - center_coordinates2[1])**2) <= radius:
            dragging = True
            start_x, start_y = x, y
            two = True
        if math.sqrt((x - center_coordinates3[0])**2 + (y - center_coordinates3[1])**2) <= radius:
            dragging = True
            start_x, start_y = x, y
            three = True
        if math.sqrt((x - center_coordinates4[0])**2 + (y - center_coordinates4[1])**2) <= radius:
            dragging = True
            start_x, start_y = x, y
            four = True
    elif event == cv2.EVENT_LBUTTONUP:
        dragging = False
        one = False
        two = False
        three = False
        four = False
    elif event == cv2.EVENT_MOUSEMOVE and dragging and one:
        dx, dy = x - start_x, y - start_y
        center_coordinates = (center_coordinates[0] + dx, center_coordinates[1] + dy)
        start_x, start_y = x, y
    elif event == cv2.EVENT_MOUSEMOVE and dragging and two:
        dx, dy = x - start_x, y - start_y
        center_coordinates2 = (center_coordinates2[0] + dx, center_coordinates2[1] + dy)
        start_x, start_y = x, y
    elif event == cv2.EVENT_MOUSEMOVE and dragging and three:
        dx, dy = x - start_x, y - start_y
        center_coordinates3 = (center_coordinates3[0] + dx, center_coordinates3[1] + dy)
        start_x, start_y = x, y
    elif event == cv2.EVENT_MOUSEMOVE and dragging and four:
        dx, dy = x - start_x, y - start_y
        center_coordinates4 = (center_coordinates4[0] + dx, center_coordinates4[1] + dy)
        start_x, start_y = x, y


color = (0, 0, 255)
thickness = -1

cv2.imshow(window_name, image)
cv2.setMouseCallback(window_name, on_mouse)  # Set up the mouse event handler

while True:
    # Clear the previous circle (you can also use a copy of the original image)
    image_copy = image.copy()

    # Draw a circle on the image copy
    image_copy = cv2.circle(image_copy, center_coordinates, radius, color, thickness)
    image_copy = cv2.circle(image_copy, center_coordinates2, radius, color, thickness)
    image_copy = cv2.circle(image_copy, center_coordinates3, radius, color, thickness)
    image_copy = cv2.circle(image_copy, center_coordinates4, radius, color, thickness)

    # Define the vertices of the quadrilateral
    vertices = np.array([center_coordinates, center_coordinates2, center_coordinates3, center_coordinates4], np.int32)

    # Reshape the vertices into a 4x1x2 array
    vertices = vertices.reshape((-1, 1, 2))

    # Define the transparent blue color (BGR format with alpha)
    transparent_blue = (255, 0, 0, 100)

    # Fill the quadrilateral with transparent blue
    cv2.fillPoly(image_copy, [vertices], transparent_blue)

    # Display the updated image with the circle
    cv2.imshow(window_name, image_copy)

    key = cv2.waitKey(30)
    if key == 27:  # Press 'Esc' key to exit the loop
        break

# Close the image window
x1, y1 = center_coordinates
x2, y2 = center_coordinates2
x3, y3 = center_coordinates3
x4, y4 = center_coordinates4

biggest_points = np.array([[[x1, y1]], [[x2, y2]], [[x3, y3]], [[x4, y4]]])


#######################################################################33



# wrapper part
# reordering the points
points_new = np.zeros_like(biggest_points)

points = biggest_points.reshape((4, 2))
add = points.sum(1)
points_new[0] = points[np.argmin(add)]
points_new[3] = points[np.argmax(add)]
diff = np.diff(points, axis=1)
points_new[1] = points[np.argmin(diff)]
points_new[2] = points[np.argmax(diff)]

# wrapping
pts1 = np.float32(points_new)
pts2 = np.float32([[0,0], [w,0], [0,h], [w,h]])
matrix = cv2.getPerspectiveTransform(pts1, pts2)
img_wrap = cv2.warpPerspective(image, matrix, (w,h))
img_wrap = img_wrap[pad:img_wrap.shape[0]-pad,pad:img_wrap.shape[1]-pad]
# Resize the image
resized_img = cv2.resize(img_wrap, (380, 554))

cv2.imshow('imgWrap', img_wrap)

img_name = f'a4_imgs/opencv_frame_{imgName}.jpg'
cv2.imwrite(img_name, img_wrap)
print(f'screenshot taken {imgName}.jpg')

c = cv2.waitKey(0)
cv2.destroyAllWindows()

#   todo 1.convert to opencv js
