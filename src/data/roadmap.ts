// Isi roadmap Waypoint. Ini satu-satunya tempat struktur roadmap ditulis.
//
// Aturan id (penting, karena progres di Supabase tersimpan per id langkah):
// - Jangan pernah mengganti atau menomori ulang id yang sudah ada.
// - Langkah baru selalu memakai id baru, misalnya "python-10", meski disisipkan di tengah.
// - Teks langkah dan judul boleh diubah kapan saja; progres tetap aman.

export type SourceKind = 'web' | 'youtube';
export interface Source { kind: SourceKind; title: string; url: string }
export interface Step { id: string; text: string }
export interface Topic { id: string; title: string; steps: Step[]; sources: Source[] }
export interface Phase { id: string; title: string; topics: Topic[] }

export const ROADMAP_TITLE = 'Roadmap Lead Data Science';

export const PHASES: Phase[] = [
  {
    "id": "f1",
    "title": "Pemrograman Dasar & Workflow Software Engineering",
    "topics": [
      {
        "id": "python",
        "title": "Python",
        "steps": [
          {
            "id": "python-01",
            "text": "Sintaks dasar, variabel, tipe data"
          },
          {
            "id": "python-02",
            "text": "Kondisional dan loop"
          },
          {
            "id": "python-03",
            "text": "Fungsi dan scope"
          },
          {
            "id": "python-04",
            "text": "List, Tuple, Dictionary, Set"
          },
          {
            "id": "python-05",
            "text": "List comprehension dan generator expressions"
          },
          {
            "id": "python-06",
            "text": "OOP: Class dan Object"
          },
          {
            "id": "python-07",
            "text": "OOP: Inheritance dan Polymorphism"
          },
          {
            "id": "python-08",
            "text": "Error dan exception handling"
          },
          {
            "id": "python-09",
            "text": "Modular code dengan pip"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "freeCodeCamp: Learn Python, Full Course for Beginners (4,5 jam)",
            "url": "https://www.youtube.com/watch?v=rfscVS0vtbw"
          },
          {
            "kind": "web",
            "title": "Dokumentasi resmi: The Python Tutorial",
            "url": "https://docs.python.org/3/tutorial/"
          },
          {
            "kind": "web",
            "title": "Kaggle Learn: Python (latihan interaktif)",
            "url": "https://www.kaggle.com/learn/python"
          }
        ]
      },
      {
        "id": "git-github",
        "title": "Git & GitHub",
        "steps": [
          {
            "id": "git-github-01",
            "text": "Init, add, commit"
          },
          {
            "id": "git-github-02",
            "text": "Branch dan checkout"
          },
          {
            "id": "git-github-03",
            "text": "Merge"
          },
          {
            "id": "git-github-04",
            "text": "Clone, pull, push"
          },
          {
            "id": "git-github-05",
            "text": "Repositori GitHub dan Pull Request"
          },
          {
            "id": "git-github-06",
            "text": "Dasar code review"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "freeCodeCamp: Git and GitHub for Beginners, Crash Course (1 jam)",
            "url": "https://www.youtube.com/watch?v=RGOj5yH7evk"
          },
          {
            "kind": "web",
            "title": "Pro Git, buku gratis resmi",
            "url": "https://git-scm.com/book/en/v2"
          },
          {
            "kind": "web",
            "title": "GitHub Skills: kursus interaktif di repositori",
            "url": "https://skills.github.com/"
          }
        ]
      },
      {
        "id": "sql",
        "title": "SQL",
        "steps": [
          {
            "id": "sql-01",
            "text": "Konsep RDBMS"
          },
          {
            "id": "sql-02",
            "text": "SELECT, WHERE, ORDER BY"
          },
          {
            "id": "sql-03",
            "text": "GROUP BY dan HAVING"
          },
          {
            "id": "sql-04",
            "text": "Fungsi agregat"
          },
          {
            "id": "sql-05",
            "text": "JOIN"
          },
          {
            "id": "sql-06",
            "text": "Subquery"
          },
          {
            "id": "sql-07",
            "text": "Primary key dan foreign key"
          },
          {
            "id": "sql-08",
            "text": "Normalisasi"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "freeCodeCamp: SQL Tutorial, Full Database Course for Beginners (4 jam)",
            "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY"
          },
          {
            "kind": "web",
            "title": "Kaggle Learn: Intro to SQL",
            "url": "https://www.kaggle.com/learn/intro-to-sql"
          },
          {
            "kind": "web",
            "title": "SQLBolt: latihan SQL bertahap",
            "url": "https://sqlbolt.com/"
          },
          {
            "kind": "web",
            "title": "Harvard CS50: Introduction to Databases with SQL (kunci, relasi, normalisasi)",
            "url": "https://cs50.harvard.edu/sql/"
          }
        ]
      }
    ]
  },
  {
    "id": "f2",
    "title": "Matematika & Statistik untuk AI/ML",
    "topics": [
      {
        "id": "aljabar-linear",
        "title": "Aljabar Linear",
        "steps": [
          {
            "id": "aljabar-linear-01",
            "text": "Vektor"
          },
          {
            "id": "aljabar-linear-02",
            "text": "Operasi vektor"
          },
          {
            "id": "aljabar-linear-03",
            "text": "Matriks"
          },
          {
            "id": "aljabar-linear-04",
            "text": "Perkalian matriks"
          },
          {
            "id": "aljabar-linear-05",
            "text": "Transpose"
          },
          {
            "id": "aljabar-linear-06",
            "text": "Eigenvalues dan Eigenvectors"
          },
          {
            "id": "aljabar-linear-07",
            "text": "Matrix factorization"
          },
          {
            "id": "aljabar-linear-08",
            "text": "SVD"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "3Blue1Brown: Essence of Linear Algebra (playlist, intuisi visual)",
            "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab"
          },
          {
            "kind": "web",
            "title": "Mathematics for Machine Learning, buku gratis (bab aljabar linear, eigen, SVD)",
            "url": "https://mml-book.github.io/"
          },
          {
            "kind": "web",
            "title": "MIT OpenCourseWare 18.06 Linear Algebra",
            "url": "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/"
          }
        ]
      },
      {
        "id": "kalkulus-optimasi",
        "title": "Kalkulus & Optimasi",
        "steps": [
          {
            "id": "kalkulus-optimasi-01",
            "text": "Turunan"
          },
          {
            "id": "kalkulus-optimasi-02",
            "text": "Turunan parsial"
          },
          {
            "id": "kalkulus-optimasi-03",
            "text": "Chain rule"
          },
          {
            "id": "kalkulus-optimasi-04",
            "text": "Gradient vector"
          },
          {
            "id": "kalkulus-optimasi-05",
            "text": "Gradient descent"
          },
          {
            "id": "kalkulus-optimasi-06",
            "text": "Fungsi optimasi"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "3Blue1Brown: Essence of Calculus (seri, mulai dari bab 1)",
            "url": "https://www.youtube.com/watch?v=WUvTyaaNkzM"
          },
          {
            "kind": "youtube",
            "title": "3Blue1Brown: Neural Networks, bab 2 membahas gradient descent",
            "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi"
          },
          {
            "kind": "web",
            "title": "Khan Academy: Multivariable Calculus (turunan parsial, gradient)",
            "url": "https://www.khanacademy.org/math/multivariable-calculus"
          }
        ]
      },
      {
        "id": "probabilitas-statistik",
        "title": "Probabilitas & Statistik",
        "steps": [
          {
            "id": "probabilitas-statistik-01",
            "text": "Statistik deskriptif: mean, median, mode"
          },
          {
            "id": "probabilitas-statistik-02",
            "text": "Varians dan standar deviasi"
          },
          {
            "id": "probabilitas-statistik-03",
            "text": "Distribusi probabilitas"
          },
          {
            "id": "probabilitas-statistik-04",
            "text": "Teorema Bayes"
          },
          {
            "id": "probabilitas-statistik-05",
            "text": "Inferensi statistik"
          },
          {
            "id": "probabilitas-statistik-06",
            "text": "Hypothesis testing: p-value, z-test, t-test"
          },
          {
            "id": "probabilitas-statistik-07",
            "text": "A/B testing"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "StatQuest: Statistics Fundamentals (playlist)",
            "url": "https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9"
          },
          {
            "kind": "web",
            "title": "Seeing Theory (Brown University): probabilitas dan statistik interaktif",
            "url": "https://seeing-theory.brown.edu/"
          },
          {
            "kind": "web",
            "title": "Think Stats, buku gratis (statistik dengan Python)",
            "url": "https://greenteapress.com/thinkstats/thinkstats.pdf"
          },
          {
            "kind": "web",
            "title": "Evan Miller: kalkulator dan panduan A/B testing",
            "url": "https://www.evanmiller.org/ab-testing/"
          }
        ]
      }
    ]
  },
  {
    "id": "f3",
    "title": "Exploratory Data Analysis & Data Wrangling",
    "topics": [
      {
        "id": "numpy",
        "title": "NumPy",
        "steps": [
          {
            "id": "numpy-01",
            "text": "Array multi dimensi"
          },
          {
            "id": "numpy-02",
            "text": "Vectorization"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "NumPy: the absolute basics for beginners",
            "url": "https://numpy.org/doc/stable/user/absolute_beginners.html"
          },
          {
            "kind": "web",
            "title": "From Python to NumPy (buku gratis, fokus vectorization)",
            "url": "https://www.labri.fr/perso/nrougier/from-python-to-numpy/"
          }
        ]
      },
      {
        "id": "pandas",
        "title": "Pandas",
        "steps": [
          {
            "id": "pandas-01",
            "text": "DataFrame dan Series"
          },
          {
            "id": "pandas-02",
            "text": "Impor/ekspor CSV, JSON, SQL"
          },
          {
            "id": "pandas-03",
            "text": "Filtering"
          },
          {
            "id": "pandas-04",
            "text": "Groupby"
          },
          {
            "id": "pandas-05",
            "text": "Pivot table"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "Kaggle Learn: Pandas",
            "url": "https://www.kaggle.com/learn/pandas"
          },
          {
            "kind": "web",
            "title": "pandas: 10 minutes to pandas",
            "url": "https://pandas.pydata.org/docs/user_guide/10min.html"
          },
          {
            "kind": "youtube",
            "title": "Rob Mulla (Kaggle Grandmaster): tutorial pandas dan EDA, cari video dasar pandas",
            "url": "https://www.youtube.com/@robmulla"
          }
        ]
      },
      {
        "id": "data-cleaning",
        "title": "Data Cleaning",
        "steps": [
          {
            "id": "data-cleaning-01",
            "text": "Missing values dan imputasi"
          },
          {
            "id": "data-cleaning-02",
            "text": "Deteksi outlier"
          },
          {
            "id": "data-cleaning-03",
            "text": "Hapus duplikat"
          },
          {
            "id": "data-cleaning-04",
            "text": "Encoding fitur kategorikal"
          },
          {
            "id": "data-cleaning-05",
            "text": "Feature scaling"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "Kaggle Learn: Data Cleaning",
            "url": "https://www.kaggle.com/learn/data-cleaning"
          },
          {
            "kind": "web",
            "title": "scikit-learn: Preprocessing data (scaling, encoding)",
            "url": "https://scikit-learn.org/stable/modules/preprocessing.html"
          },
          {
            "kind": "web",
            "title": "scikit-learn: Imputation of missing values",
            "url": "https://scikit-learn.org/stable/modules/impute.html"
          }
        ]
      },
      {
        "id": "visualisasi-storytelling",
        "title": "Visualisasi & Storytelling",
        "steps": [
          {
            "id": "visualisasi-storytelling-01",
            "text": "Matplotlib: histogram dan scatter plot"
          },
          {
            "id": "visualisasi-storytelling-02",
            "text": "Seaborn: box plot dan heatmap korelasi"
          },
          {
            "id": "visualisasi-storytelling-03",
            "text": "Menyajikan insight ke audiens teknis dan non teknis"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "Kaggle Learn: Data Visualization (Seaborn)",
            "url": "https://www.kaggle.com/learn/data-visualization"
          },
          {
            "kind": "web",
            "title": "Seaborn: User guide dan tutorial",
            "url": "https://seaborn.pydata.org/tutorial.html"
          },
          {
            "kind": "web",
            "title": "Matplotlib: Quick start guide",
            "url": "https://matplotlib.org/stable/users/explain/quick_start.html"
          },
          {
            "kind": "web",
            "title": "Storytelling with Data: blog (menyajikan insight ke non teknis)",
            "url": "https://www.storytellingwithdata.com/blog"
          }
        ]
      }
    ]
  },
  {
    "id": "f4",
    "title": "Classical Machine Learning",
    "topics": [
      {
        "id": "supervised-learning",
        "title": "Supervised Learning",
        "steps": [
          {
            "id": "supervised-learning-01",
            "text": "Linear Regression"
          },
          {
            "id": "supervised-learning-02",
            "text": "Ridge dan Lasso"
          },
          {
            "id": "supervised-learning-03",
            "text": "Logistic Regression"
          },
          {
            "id": "supervised-learning-04",
            "text": "Decision Tree"
          },
          {
            "id": "supervised-learning-05",
            "text": "Random Forest"
          },
          {
            "id": "supervised-learning-06",
            "text": "SVM"
          },
          {
            "id": "supervised-learning-07",
            "text": "XGBoost dan LightGBM"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "StatQuest: Machine Learning (regresi, tree, forest, SVM, boosting)",
            "url": "https://www.youtube.com/@statquest"
          },
          {
            "kind": "web",
            "title": "scikit-learn: Supervised learning",
            "url": "https://scikit-learn.org/stable/supervised_learning.html"
          },
          {
            "kind": "web",
            "title": "Kaggle Learn: Intro to Machine Learning",
            "url": "https://www.kaggle.com/learn/intro-to-machine-learning"
          },
          {
            "kind": "web",
            "title": "XGBoost: Introduction to Boosted Trees",
            "url": "https://xgboost.readthedocs.io/en/stable/tutorials/model.html"
          }
        ]
      },
      {
        "id": "unsupervised-learning",
        "title": "Unsupervised Learning",
        "steps": [
          {
            "id": "unsupervised-learning-01",
            "text": "K-Means"
          },
          {
            "id": "unsupervised-learning-02",
            "text": "DBSCAN"
          },
          {
            "id": "unsupervised-learning-03",
            "text": "Hierarchical Clustering"
          },
          {
            "id": "unsupervised-learning-04",
            "text": "Principal Component Analysis"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "scikit-learn: Unsupervised learning (clustering, PCA)",
            "url": "https://scikit-learn.org/stable/unsupervised_learning.html"
          },
          {
            "kind": "youtube",
            "title": "StatQuest: K-means, PCA, dan clustering, cari di channel",
            "url": "https://www.youtube.com/@statquest"
          }
        ]
      },
      {
        "id": "evaluasi-model",
        "title": "Evaluasi Model",
        "steps": [
          {
            "id": "evaluasi-model-01",
            "text": "Metrik regresi: MSE, RMSE, MAE, R squared"
          },
          {
            "id": "evaluasi-model-02",
            "text": "Metrik klasifikasi: Accuracy, Precision, Recall, F1"
          },
          {
            "id": "evaluasi-model-03",
            "text": "Confusion Matrix dan ROC-AUC"
          },
          {
            "id": "evaluasi-model-04",
            "text": "K-Fold Cross Validation"
          },
          {
            "id": "evaluasi-model-05",
            "text": "Bias variance tradeoff"
          },
          {
            "id": "evaluasi-model-06",
            "text": "Hyperparameter tuning"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "scikit-learn: Model evaluation (metrik, ROC-AUC, confusion matrix)",
            "url": "https://scikit-learn.org/stable/modules/model_evaluation.html"
          },
          {
            "kind": "web",
            "title": "Kaggle Learn: Intermediate Machine Learning (cross validation, pipeline)",
            "url": "https://www.kaggle.com/learn/intermediate-machine-learning"
          },
          {
            "kind": "youtube",
            "title": "StatQuest: Cross Validation, Bias and Variance, ROC dan AUC",
            "url": "https://www.youtube.com/@statquest"
          }
        ]
      }
    ]
  },
  {
    "id": "f5",
    "title": "Deep Learning & Neural Networks",
    "topics": [
      {
        "id": "dasar-neural-networks",
        "title": "Dasar Neural Networks",
        "steps": [
          {
            "id": "dasar-neural-networks-01",
            "text": "Perceptron dan layers"
          },
          {
            "id": "dasar-neural-networks-02",
            "text": "Activation functions: ReLU, Sigmoid, Tanh, Softmax"
          },
          {
            "id": "dasar-neural-networks-03",
            "text": "Forward propagation"
          },
          {
            "id": "dasar-neural-networks-04",
            "text": "Loss function"
          },
          {
            "id": "dasar-neural-networks-05",
            "text": "Backpropagation"
          },
          {
            "id": "dasar-neural-networks-06",
            "text": "Optimizer"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "3Blue1Brown: Neural Networks (playlist, bab 1 sampai 4 untuk backprop)",
            "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi"
          },
          {
            "kind": "youtube",
            "title": "Andrej Karpathy: Neural Networks, Zero to Hero (membangun dari nol dengan kode)",
            "url": "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ"
          },
          {
            "kind": "web",
            "title": "Dive into Deep Learning (buku gratis dengan kode)",
            "url": "https://d2l.ai/"
          },
          {
            "kind": "web",
            "title": "Neural Networks and Deep Learning (Michael Nielsen)",
            "url": "http://neuralnetworksanddeeplearning.com/"
          }
        ]
      },
      {
        "id": "computer-vision",
        "title": "Computer Vision",
        "steps": [
          {
            "id": "computer-vision-01",
            "text": "CNN dan pooling layer"
          },
          {
            "id": "computer-vision-02",
            "text": "Transfer learning dengan ResNet"
          },
          {
            "id": "computer-vision-03",
            "text": "YOLO"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "Stanford CS231n: Convolutional Neural Networks",
            "url": "https://cs231n.github.io/"
          },
          {
            "kind": "web",
            "title": "Hugging Face: Computer Vision Course",
            "url": "https://huggingface.co/learn/computer-vision-course"
          },
          {
            "kind": "web",
            "title": "Ultralytics: dokumentasi YOLO",
            "url": "https://docs.ultralytics.com/"
          }
        ]
      },
      {
        "id": "nlp",
        "title": "NLP",
        "steps": [
          {
            "id": "nlp-01",
            "text": "RNN"
          },
          {
            "id": "nlp-02",
            "text": "LSTM"
          },
          {
            "id": "nlp-03",
            "text": "Word Embeddings"
          },
          {
            "id": "nlp-04",
            "text": "Self attention"
          },
          {
            "id": "nlp-05",
            "text": "Dasar arsitektur Transformer"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "Colah: Understanding LSTM Networks",
            "url": "https://colah.github.io/posts/2015-08-Understanding-LSTMs/"
          },
          {
            "kind": "web",
            "title": "Jay Alammar: The Illustrated Transformer",
            "url": "https://jalammar.github.io/illustrated-transformer/"
          },
          {
            "kind": "youtube",
            "title": "3Blue1Brown: Neural Networks, bab 6 (attention di transformer)",
            "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi"
          },
          {
            "kind": "web",
            "title": "Hugging Face LLM Course (bab Transformer)",
            "url": "https://huggingface.co/learn/llm-course/chapter1/1"
          }
        ]
      },
      {
        "id": "framework",
        "title": "Framework",
        "steps": [
          {
            "id": "framework-01",
            "text": "PyTorch"
          },
          {
            "id": "framework-02",
            "text": "TensorFlow/Keras"
          },
          {
            "id": "framework-03",
            "text": "Membangun, melatih, dan mengevaluasi model"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "PyTorch: Learn the Basics",
            "url": "https://pytorch.org/tutorials/beginner/basics/intro.html"
          },
          {
            "kind": "web",
            "title": "Keras: Getting started",
            "url": "https://keras.io/getting_started/"
          },
          {
            "kind": "web",
            "title": "fast.ai: Practical Deep Learning for Coders",
            "url": "https://course.fast.ai/"
          }
        ]
      }
    ]
  },
  {
    "id": "f6",
    "title": "Applied ML Engineering & MLOps Dasar",
    "topics": [
      {
        "id": "model-serving",
        "title": "Model Serving",
        "steps": [
          {
            "id": "model-serving-01",
            "text": "Mengubah model menjadi fungsi prediksi"
          },
          {
            "id": "model-serving-02",
            "text": "Membungkus model jadi REST API dengan FastAPI atau Flask"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "freeCodeCamp: Python API Development, Comprehensive Course (FastAPI, database, CI/CD)",
            "url": "https://www.youtube.com/watch?v=0sOvCWFmrtA"
          },
          {
            "kind": "web",
            "title": "FastAPI: Tutorial resmi",
            "url": "https://fastapi.tiangolo.com/tutorial/"
          },
          {
            "kind": "web",
            "title": "Made With ML: kursus MLOps dari desain sampai serving",
            "url": "https://madewithml.com/"
          }
        ]
      },
      {
        "id": "docker",
        "title": "Docker",
        "steps": [
          {
            "id": "docker-01",
            "text": "Menulis Dockerfile"
          },
          {
            "id": "docker-02",
            "text": "Memaketkan kode dan dependensi"
          },
          {
            "id": "docker-03",
            "text": "Menjalankan container"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "TechWorld with Nana: Docker Tutorial for Beginners (3 jam)",
            "url": "https://www.youtube.com/watch?v=3c-iBn73dDE"
          },
          {
            "kind": "web",
            "title": "Docker: Get started (dokumentasi resmi)",
            "url": "https://docs.docker.com/get-started/"
          }
        ]
      },
      {
        "id": "deployment-cloud",
        "title": "Deployment Cloud",
        "steps": [
          {
            "id": "deployment-cloud-01",
            "text": "Deploy API ke Render, Hugging Face Spaces, atau AWS EC2/App Runner"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "Hugging Face Hub: Your First Docker Space (deploy FastAPI)",
            "url": "https://huggingface.co/docs/hub/spaces-sdks-docker-first-demo"
          },
          {
            "kind": "web",
            "title": "Render: Deploy FastAPI",
            "url": "https://render.com/docs/deploy-fastapi"
          },
          {
            "kind": "web",
            "title": "AWS App Runner: panduan resmi",
            "url": "https://docs.aws.amazon.com/apprunner/latest/dg/what-is-apprunner.html"
          }
        ]
      }
    ]
  },
  {
    "id": "f7",
    "title": "Generative AI, LLM & Modern AI Applications",
    "topics": [
      {
        "id": "llm",
        "title": "LLM",
        "steps": [
          {
            "id": "llm-01",
            "text": "Arsitektur Transformer encoder/decoder"
          },
          {
            "id": "llm-02",
            "text": "Prompt engineering"
          },
          {
            "id": "llm-03",
            "text": "Fine tuning dengan Hugging Face Transformers"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "Hugging Face LLM Course (Transformers, fine tuning)",
            "url": "https://huggingface.co/learn/llm-course/chapter1/1"
          },
          {
            "kind": "youtube",
            "title": "Andrej Karpathy: Neural Networks, Zero to Hero (berujung ke membangun GPT)",
            "url": "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ"
          },
          {
            "kind": "web",
            "title": "Prompt Engineering Guide",
            "url": "https://www.promptingguide.ai/"
          },
          {
            "kind": "web",
            "title": "Anthropic: Prompt engineering overview",
            "url": "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview"
          }
        ]
      },
      {
        "id": "rag-ai-agents",
        "title": "RAG & AI Agents",
        "steps": [
          {
            "id": "rag-ai-agents-01",
            "text": "Vector database: ChromaDB, Pinecone, atau FAISS"
          },
          {
            "id": "rag-ai-agents-02",
            "text": "Aplikasi RAG berbasis dokumen dengan LangChain atau LlamaIndex"
          }
        ],
        "sources": [
          {
            "kind": "youtube",
            "title": "freeCodeCamp: Learn RAG From Scratch, dari engineer LangChain (2,5 jam)",
            "url": "https://www.youtube.com/watch?v=sVcwVQRHIc8"
          },
          {
            "kind": "youtube",
            "title": "LangChain: RAG From Scratch (playlist resmi)",
            "url": "https://www.youtube.com/playlist?list=PLfaIDFEXuae2LXbO1_PKyVJiQ23ZztA0x"
          },
          {
            "kind": "web",
            "title": "LangChain: dokumentasi",
            "url": "https://python.langchain.com/docs/introduction/"
          },
          {
            "kind": "web",
            "title": "LlamaIndex: dokumentasi",
            "url": "https://docs.llamaindex.ai/"
          },
          {
            "kind": "web",
            "title": "Chroma: dokumentasi vector database",
            "url": "https://docs.trychroma.com/"
          },
          {
            "kind": "web",
            "title": "DataTalks.Club LLM Zoomcamp (kursus gratis, RAG dan evaluasi)",
            "url": "https://github.com/DataTalksClub/llm-zoomcamp"
          }
        ]
      }
    ]
  },
  {
    "id": "f8",
    "title": "Advanced MLOps, System Architecture & Governance",
    "topics": [
      {
        "id": "tracking-monitoring",
        "title": "Tracking & Monitoring",
        "steps": [
          {
            "id": "tracking-monitoring-01",
            "text": "Tracking eksperimen dengan MLflow"
          },
          {
            "id": "tracking-monitoring-02",
            "text": "Data drift"
          },
          {
            "id": "tracking-monitoring-03",
            "text": "Concept drift"
          },
          {
            "id": "tracking-monitoring-04",
            "text": "Latensi dan degradasi performa"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "MLflow: dokumentasi resmi",
            "url": "https://mlflow.org/docs/latest/"
          },
          {
            "kind": "web",
            "title": "DataTalks.Club MLOps Zoomcamp (tracking, deployment, monitoring)",
            "url": "https://github.com/DataTalksClub/mlops-zoomcamp"
          },
          {
            "kind": "web",
            "title": "Evidently AI: dokumentasi (data drift dan monitoring)",
            "url": "https://docs.evidentlyai.com/"
          }
        ]
      },
      {
        "id": "ci-cd-untuk-ml",
        "title": "CI/CD untuk ML",
        "steps": [
          {
            "id": "ci-cd-untuk-ml-01",
            "text": "Automasi pengujian model"
          },
          {
            "id": "ci-cd-untuk-ml-02",
            "text": "Automasi deployment via GitHub Actions"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "GitHub Actions: dokumentasi",
            "url": "https://docs.github.com/en/actions"
          },
          {
            "kind": "web",
            "title": "Google Cloud: MLOps, continuous delivery dan automation pipelines",
            "url": "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning"
          },
          {
            "kind": "web",
            "title": "Made With ML: pelajaran testing, CI/CD, dan produksi",
            "url": "https://madewithml.com/"
          }
        ]
      },
      {
        "id": "governance-security",
        "title": "Governance & Security",
        "steps": [
          {
            "id": "governance-security-01",
            "text": "Standar kualitas data"
          },
          {
            "id": "governance-security-02",
            "text": "Manajemen risiko model"
          },
          {
            "id": "governance-security-03",
            "text": "Dokumentasi reproducibility"
          },
          {
            "id": "governance-security-04",
            "text": "Privasi data"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "NIST: AI Risk Management Framework",
            "url": "https://www.nist.gov/itl/ai-risk-management-framework"
          },
          {
            "kind": "web",
            "title": "Model Cards for Model Reporting (paper, dokumentasi model)",
            "url": "https://arxiv.org/abs/1810.03993"
          },
          {
            "kind": "web",
            "title": "Google: Rules of Machine Learning",
            "url": "https://developers.google.com/machine-learning/guides/rules-of-ml"
          }
        ]
      }
    ]
  },
  {
    "id": "f9",
    "title": "Technical Leadership, Mentorship & Capstone",
    "topics": [
      {
        "id": "prinsip-lead-data-scientist",
        "title": "Prinsip Lead Data Scientist",
        "steps": [
          {
            "id": "prinsip-lead-data-scientist-01",
            "text": "Leverage: tooling, pustaka internal, data asset bersama"
          },
          {
            "id": "prinsip-lead-data-scientist-02",
            "text": "Mentorship dan code review untuk tim junior"
          },
          {
            "id": "prinsip-lead-data-scientist-03",
            "text": "Clean code guidelines"
          },
          {
            "id": "prinsip-lead-data-scientist-04",
            "text": "Menerjemahkan masalah bisnis jadi problem statement dan hipotesis teruji"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "Google Engineering Practices: code review",
            "url": "https://google.github.io/eng-practices/review/"
          },
          {
            "kind": "web",
            "title": "Google Python Style Guide (clean code guidelines)",
            "url": "https://google.github.io/styleguide/pyguide.html"
          },
          {
            "kind": "web",
            "title": "Hidden Technical Debt in Machine Learning Systems (paper)",
            "url": "https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html"
          },
          {
            "kind": "web",
            "title": "Google PAIR: People + AI Guidebook",
            "url": "https://pair.withgoogle.com/guidebook/"
          }
        ]
      },
      {
        "id": "proyek-capstone",
        "title": "Proyek Capstone",
        "steps": [
          {
            "id": "proyek-capstone-01",
            "text": "Riset dan arsitektur data"
          },
          {
            "id": "proyek-capstone-02",
            "text": "Model RAG/ML"
          },
          {
            "id": "proyek-capstone-03",
            "text": "API Docker dan CI/CD"
          },
          {
            "id": "proyek-capstone-04",
            "text": "Dashboard dampak bisnis"
          },
          {
            "id": "proyek-capstone-05",
            "text": "Dokumentasi teknis"
          },
          {
            "id": "proyek-capstone-06",
            "text": "Presentasi eksekutif untuk stakeholder"
          }
        ],
        "sources": [
          {
            "kind": "web",
            "title": "DataTalks.Club Machine Learning Zoomcamp (proyek capstone ML)",
            "url": "https://github.com/DataTalksClub/machine-learning-zoomcamp"
          },
          {
            "kind": "web",
            "title": "DataTalks.Club MLOps Zoomcamp (proyek end to end)",
            "url": "https://github.com/DataTalksClub/mlops-zoomcamp"
          },
          {
            "kind": "web",
            "title": "Kaggle Competitions: sumber dataset dan masalah nyata",
            "url": "https://www.kaggle.com/competitions"
          },
          {
            "kind": "web",
            "title": "Storytelling with Data: materi presentasi ke eksekutif",
            "url": "https://www.storytellingwithdata.com/blog"
          }
        ]
      }
    ]
  }
];

/** Urutan langkah di roadmap HTML lama (checkbox c1, c2, ...). Dipakai untuk impor progres lama. */
export const LEGACY_ORDER: string[] = PHASES.flatMap(p => p.topics.flatMap(t => t.steps.map(s => s.id)));
