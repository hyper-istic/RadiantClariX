import streamlit as st
import torch
import torchvision
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from PIL import Image
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import warnings

# ---------------------------------------------
# Suppress warnings
warnings.filterwarnings("ignore")

# ---------------------------------------------
# Model + Helper Functions
# ---------------------------------------------
CLASSES = [
    'elbow positive', 'fingers positive', 'forearm fracture',
    'humerus fracture', 'humerus', 'shoulder fracture', 'wrist positive'
]
NUM_CLASSES = len(CLASSES)


def get_model(model_path="xray_models/bones/resnet.pt", device="cpu"):
    """Load a Faster R-CNN model with a ResNet50 backbone."""
    model = torchvision.models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, NUM_CLASSES)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    return model


def make_prediction(model, img, threshold):
    """Run inference and filter predictions by confidence threshold."""
    with torch.no_grad():
        preds = model(img)
        for pred in preds:
            keep = [i for i, score in enumerate(pred["scores"]) if score > threshold]
            pred["boxes"] = pred["boxes"][keep]
            pred["labels"] = pred["labels"][keep]
            pred["scores"] = pred["scores"][keep]
        return preds


def plot_image_from_output(img_tensor, annotation):
    """Draw bounding boxes on the image tensor."""
    img = img_tensor.cpu().detach().permute(1, 2, 0).numpy()
    fig, ax = plt.subplots(1)
    ax.imshow(img)
    ax.axis("off")

    class_name = None
    if annotation and "scores" in annotation and len(annotation["scores"]) > 0:
        max_idx = torch.argmax(annotation["scores"]).item()
        xmin, ymin, xmax, ymax = annotation["boxes"][max_idx].detach().cpu().numpy()
        label_idx = annotation["labels"][max_idx].item()
        class_name = CLASSES[label_idx] if label_idx < len(CLASSES) else "Unknown"

        rect = patches.Rectangle(
            (xmin, ymin), xmax - xmin, ymax - ymin,
            linewidth=2, edgecolor="orange", facecolor="none"
        )
        ax.add_patch(rect)
        ax.text(xmin, ymin - 10, class_name, fontsize=12, color="orange", fontweight="bold")

    return fig, class_name


def figure_to_array(fig):
    """Convert matplotlib figure to numpy array."""
    fig.canvas.draw()
    return np.array(fig.canvas.renderer._renderer)


# ---------------------------------------------
# Streamlit UI
# ---------------------------------------------
st.set_page_config(page_title="Bone Fracture Detection", layout="wide")

# Removed logo image
conf_threshold = st.sidebar.slider("Confidence Threshold", 0.0, 1.0, 0.5, 0.05)
model_path = "xray_models/bones/resnet.pt"

# Auto-select device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
st.sidebar.write(f"Using device: **{device}**")

st.title("🦴 Bone Fracture Detection - ResNet Model")
st.write(
    "Upload an X-ray image to detect possible fractures using a **ResNet-based Faster R-CNN model**. "
    "This model localizes and classifies fractures with high accuracy."
)

tab1, tab2 = st.tabs(["Overview", "Test"])

# ---------------- OVERVIEW TAB ----------------
with tab1:
    st.markdown("### Model Overview")
    st.markdown("""
    #### Model Description
    This model uses **Faster R-CNN with a ResNet-50 backbone** for fracture detection in bone X-rays.  
    It identifies fractures by detecting and classifying regions of interest within the image.  
    Trained on X-ray data, it assists radiologists in diagnosing fractures more quickly and accurately.
    """)

# ---------------- TEST TAB ----------------
with tab2:
    st.markdown("### Upload & Test")

    image = st.file_uploader("Upload an X-ray image", type=["jpg", "jpeg", "png"])

    if image is not None:
        st.write(f"**Selected file:** {image.name}")

        try:
            model = get_model(model_path, device)
            st.success("✅ Model loaded successfully!")
        except Exception as ex:
            st.error(f"❌ Failed to load model from `{model_path}`")
            st.exception(ex)
            st.stop()

        col1, col2 = st.columns(2)
        uploaded_image = Image.open(image).convert("RGB")

        with col1:
            st.image(uploaded_image, caption="Uploaded X-ray", use_column_width=True)

        if st.button("Run Detection"):
            with st.spinner("Detecting fractures..."):
                try:
                    to_tensor = torchvision.transforms.ToTensor()
                    tensor_img = to_tensor(uploaded_image).unsqueeze(0).to(device)

                    preds = make_prediction(model, tensor_img, conf_threshold)
                    fig, class_name = plot_image_from_output(tensor_img[0].cpu(), preds[0])
                    img_array = figure_to_array(fig)

                    with col2:
                        st.image(img_array, caption="Detection Result", use_column_width=True)
                        with st.expander("Detection Details"):
                            st.write(f"**Detected Class:** {class_name or 'No detection'}")
                            st.write(preds)

                except Exception as ex:
                    st.error("Error during detection.")
                    st.exception(ex)
    else:
        st.info("⬆️ Please upload an image to begin testing.")
